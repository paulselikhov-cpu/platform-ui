import {
  Component, input, inject, effect,
  viewChild, ElementRef, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { ChatWebSocketService } from '../../../services/chat-websocket.service';
import { MessageContextMenu, ContextMenuAction } from './message-context-menu/message-context-menu';
import { SelectionToolbar } from './selection-toolbar/selection-toolbar';
import { MessageContextMenuService } from '../../../services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../services/messages/message-selection.service';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { MessageArea } from './message-area/message-area';
import { IChatMessage, IChatMessageResponse, ISystemMessage } from '../../../models/messages/message.interface';
import { MessageService } from '../../../services/http-services/message.service';
import { isChatMessage, isSystemMessage } from '../../../type-guards/chat-message.guard';
import { AuthService } from '../../../services/http-services/auth.service';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, DatePipe, MessageContextMenu, SelectionToolbar, MessageArea],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  readonly room = input.required<IRoom>();
  readonly location = input.required<ILocation>();

  //Общее
  private readonly auth = inject(AuthService);
  private readonly user = this.auth.currentUser;
  private readonly chatService = inject(ChatWebSocketService);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  //Контекстное меню и действия с элементами
  private readonly messageContextMenuService = inject(MessageContextMenuService);
  private readonly deletedIds = this.chatService.deletedMessageIds;
  private readonly replyTo = signal<IChatMessageResponse | null>(null);
  readonly selectionService = inject(MessageSelectionService);
  readonly messageContextMenuState = this.messageContextMenuService.state;
  
  //История из БД (загружается один раз при открытии комнаты)
  readonly history = signal<IChatMessageResponse[]>([]);
  readonly historyLoading = signal(false);

  //Реалтайм сообщения из WebSocket
  private messageService = inject(MessageService);
  readonly messages = this.chatService.messages;
  readonly connected = this.chatService.connected;

  //Action - юзер печатает...
  readonly typingUsers = this.chatService.typingUsers;


  // новое состояние: id первого непрочитанного сообщения на момент открытия комнаты.
  // Не меняется, пока комната открыта — иначе разделитель "убегал" бы вниз
  // по мере того, как приходят новые realtime-сообщения (это неверно:
  // разделитель должен показывать границу именно "что было непрочитано,
  // когда я зашёл", а не двигаться живьём).
  readonly firstUnreadMessageId = signal<number | null>(null);

  constructor() {
    // при смене комнаты — подключаемся к WS и загружаем историю
    effect(() => {
      const room = this.room();
      const location = this.location();
      if (room) {
        this.chatService.connect(String(location.id), String(room.id));
        this.loadHistory(room.id);
        this.selectionService.clearSelection();
        this.scrollToBottom();
      }
    });

    // effect(() => {
    //   this.messages();
    // });

    // Слушаем удаленные сообщения
    effect(() => {
      const ids = this.deletedIds();
      if (ids.size === 0) return;
      const updateMessageState = ( (message: IChatMessageResponse) => {
        if(!isChatMessage(message)) {
          return message
        }
        return ids.has(message.id) ? { ...message, isDeleted: true, content: 'Сообщение удалено' } : message
      })

      this.history.update(messages => messages.map(updateMessageState));
      this.messages.update(messages => messages.map(updateMessageState));
    });
  }

  onContextAction(action: ContextMenuAction) {
    switch (action.type) {
      case 'reply':
        const messages = [...this.history(), ...this.messages()]
          .filter(isChatMessage)
          .find(message => message.id === action.messageId);
        if (messages) this.replyTo.set(messages);
        break;
      case 'delete':
        this.deleteSingleMessage(action.messageId);
        break;
    }
  }

  // ─── удаление ────────────────────────────────────────────────────────────

  deleteSingleMessage(messageId: number) {
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        const updateMessageState = (message: IChatMessageResponse) => {
          if (!isChatMessage(message)) return message;
          if (message.id !== messageId) return message;
          return { ...message, isDeleted: true, content: 'Сообщение удалено' };
        };

        this.history.update(messages => messages.map(updateMessageState));
        this.messages.update(messages => messages.map(updateMessageState));
      }
    });
  }

  onDeleteSelected(ids: number[]) {
    this.messageService.deleteMessages(ids).subscribe({
      next: () => {
        const markDeleted = (message: IChatMessageResponse) => {
          if (!isChatMessage(message)) return message;
          if (!ids.includes(message.id)) return message;
          return { ...message, isDeleted: true, content: 'Сообщение удалено' };
        };

        this.history.update(messages => messages.map(markDeleted));
        this.messages.update(messages => messages.map(markDeleted));
        this.selectionService.clearSelection();
      }
    });
  }

  onCopySelected(ids: number[]) {
    const allText = [...this.history(), ...this.messages()]
      .filter(isChatMessage)                     
      .filter(message => ids.includes(message.id) && !message.isDeleted)
      .map(message => `${message.character.characterName}: ${message.content}`)
      .join('\n');

    navigator.clipboard.writeText(allText);
    this.selectionService.clearSelection();
  }

  cancelReply() {
    this.replyTo.set(null);
  }

  // ─── остальные методы ────────────────────────────────────────────────────

  loadHistory(roomId: number) {
    this.historyLoading.set(true);
    this.history.set([]);
    this.firstUnreadMessageId.set(null);

    const characterId = this.user()?.userId; // подставьте реальный источник characterId
    if (!characterId) {
      this.historyLoading.set(false);
      return;
    }

    this.messageService.getMessageHistory(roomId, characterId).subscribe({
      next: (response) => {
        this.history.set(response.messages);
        this.firstUnreadMessageId.set(response.firstUnreadMessageId);
        this.historyLoading.set(false);

        // если есть непрочитанные — скроллим К РАЗДЕЛИТЕЛЮ, а не в самый низ
        // (как это делает Telegram/Slack — так пользователь сразу видит,
        // что именно он пропустил, а не долистывает вручную наверх)
        if (response.firstUnreadMessageId != null) {
          this.scrollToUnreadDivider();
        } else {
          this.scrollToBottom();
        }
      },
      error: () => this.historyLoading.set(false)
    });
  }

  private scrollToUnreadDivider(): void {
    setTimeout(() => {
      const el = this.messagesEl()?.nativeElement;
      const divider = el?.querySelector('.unread-divider');
      divider?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  }

  sendMessage(text: string): void {
    this.chatService.sendMessageWithSaveHistory(text, String(this.room().id));
    this.replyTo.set(null);
  }

  sendFile(file: File): void {
    console.log('Файл:', file.name);
  }

  sendVoice(blob: Blob): void {
    console.log('Голосовое:', blob.size);
  }

  getSenderName(message: IChatMessageResponse): string {
    return message.character?.characterName ?? 'Неизвестный';
  }

  getAvatarLetter(message: IChatMessageResponse): string {
    return (message.character?.characterName ?? '?')[0].toUpperCase();
  }

  getFirstTypingUser(): string {
    return Array.from(this.typingUsers())[0] ?? '';
  }

  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }

  // Отфильтрованные геттеры для шаблона.
  isChatMessage = isChatMessage;
  isSystemMessage = isSystemMessage;

  get chatHistory(): IChatMessage[] {
    return this.history().filter(isChatMessage);
  }

  get chatMessages(): IChatMessage[] {
    return this.messages().filter(isChatMessage);
  }

  get systemMessages(): ISystemMessage[] {
    return this.messages().filter(isSystemMessage);
  }

  getAllMessages(): IChatMessage[] {
    return [...this.history(), ...this.messages()].filter(isChatMessage);
  }
}