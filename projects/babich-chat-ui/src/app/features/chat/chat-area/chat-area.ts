import {
  Component, input, inject, effect,
  viewChild, ElementRef, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { IRoom } from '../../../models/location/location.interface';
import { ChatService } from '../../../services/chat.service';
import { MessageContextMenu, ContextMenuAction } from './message-context-menu/message-context-menu';
import { SelectionToolbar } from './selection-toolbar/selection-toolbar';
import { MessageContextMenuService } from '../../../services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../services/message-selection.service';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { MessageArea } from './message-area/message-area';
import { IChatMessage, IChatMessageResponse, ISystemMessage } from '../../../models/chat/message.interface';
import { MessageService } from '../../../services/message/message.service';
import { isChatMessage, isDeleteMessage, isSystemMessage } from '../../../type-guards/chat-message.guard';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, DatePipe, MessageContextMenu, SelectionToolbar, MessageArea],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  room = input.required<IRoom>();
  private chatService = inject(ChatService);
  private messageService = inject(MessageService);
  private ctxMenuService = inject(MessageContextMenuService);
  readonly selectionService = inject(MessageSelectionService);

  private messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly typingUsers = this.chatService.typingUsers;
  readonly deletedIds = this.chatService.deletedMessageIds;

  readonly ctxMenuState = this.ctxMenuService.state;

  // история из БД (загружается один раз при открытии комнаты)
  history = signal<IChatMessageResponse[]>([]);
  historyLoading = signal(false);

  // реалтайм сообщения из WebSocket
  readonly messages = this.chatService.messages;
  readonly connected = this.chatService.connected;

  // reply state
  replyTo = signal<IChatMessageResponse | null>(null);

  constructor() {
    // при смене комнаты — подключаемся к WS и загружаем историю
    effect(() => {
      const room = this.room();
      if (room) {
        this.chatService.connect(String(room.id));
        this.loadHistory(room.id);
        this.selectionService.clearSelection(); // сбрасываем при смене комнаты
      }
    });

    // автоскролл при новом WS сообщении
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });

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
    this.messageService.getMessageHistory(roomId).subscribe({
      next: (messages) => {
        this.history.set(messages);
        this.historyLoading.set(false);
        this.scrollToBottom();
      },
      error: () => this.historyLoading.set(false)
    });
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
}