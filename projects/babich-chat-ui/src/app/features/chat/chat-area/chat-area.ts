import {
  Component, input, inject, effect,
  viewChild, ElementRef, signal,
  OnDestroy,
  computed,
} from '@angular/core';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { MessageContextMenu, ContextMenuAction } from './message-context-menu/message-context-menu';
import { SelectionToolbar } from './selection-toolbar/selection-toolbar';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { MessageArea } from './message-area/message-area';
import { IChatMessage, IChatMessageResponse, ISystemMessage } from '../../../models/messages/message.interface';
import { isChatMessage, isSystemMessage } from '../../../type-guards/chat-message.guard';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { ChatWebSocketService } from '../../../services/backend-services/chat/webSocket/chat-websocket.service';
import { MessageContextMenuService } from '../../../services/frontend-services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../services/frontend-services/messages/message-selection.service';
import { MessageService } from '../../../services/backend-services/chat/http/message.service';
import { UnreadDivider } from './unread-divider/unread-divider';
import { JumpToUnreadButton } from './jump-to-unread-button/jump-to-unread-button';
import { MessageUnreadTrackerService } from '../../../services/frontend-services/messages/message-unread-tracker.service';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, MessageContextMenu, SelectionToolbar, MessageArea, UnreadDivider, JumpToUnreadButton],
  providers: [MessageUnreadTrackerService], // свой инстанс сервиса на каждый ChatArea (на комнату)
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea implements OnDestroy {
  readonly room = input.required<IRoom>();
  readonly location = input.required<ILocation>();
  readonly onlineIds = input.required<Set<number>>();
  //Общее
  private readonly auth = inject(AuthService);
  private readonly user = this.auth.currentUser;
  private readonly chatWebSocketService = inject(ChatWebSocketService);
  private readonly messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');
  private readonly bottomSentinel = viewChild<ElementRef<HTMLDivElement>>('bottomSentinel');

  //Контекстное меню и действия с элементами
  private readonly messageContextMenuService = inject(MessageContextMenuService);
  private readonly deletedIds = this.chatWebSocketService.deletedMessageIds;
  private readonly replyTo = signal<IChatMessageResponse | null>(null);
  readonly selectionService = inject(MessageSelectionService);
  readonly messageContextMenuState = this.messageContextMenuService.state;

  //Прочтение сообщений в реал-тайм режиме для бэка
  private readReportTimer: ReturnType<typeof setTimeout> | null = null;

  // Автоскролл для входящих realtime-сообщений (не только своих)
  private lastMessagesCount = 0;

  //История из БД (загружается один раз при открытии комнаты)
  readonly history = signal<IChatMessageResponse[]>([]);
  readonly historyLoading = signal(false);

  //Реалтайм сообщения из WebSocket
  private messageService = inject(MessageService);
  readonly messages = this.chatWebSocketService.messages;
  readonly connected = this.chatWebSocketService.connected;

  //Action - юзер печатает...
  readonly typingUsers = this.chatWebSocketService.typingUsers;

  // id первого непрочитанного сообщения на момент открытия комнаты — приходит с бэка
  // один раз при loadHistory и больше не пересчитывается, чтобы разделитель не "убегал"
  readonly firstUnreadMessageId = signal<number | null>(null);

  // непрочитанные — UI-состояние (анимации, dwell-таймер), сам факт "прочитано"
  // уже атомарно зафиксирован на бэке внутри getHistoryAndMarkRead
  readonly unreadTracker = inject(MessageUnreadTrackerService);

  //Если мы находимся в середине чата и пришли новые сообщения, нужно чтобы появился счетчик непрочитанных
  private lastNotifiedMessagesCount = 0;

  // защита от повторного вызова loadHistory для той же комнаты при лишних
  // перезапусках effect() (например, если room()/location() пересоздаются
  // как объекты выше по дереву) — иначе getHistoryAndMarkRead молча
  // "съедает" непрочитанные повторным вызовом, т.к. он не идемпотентен
  private lastLoadedRoomId: number | null = null;

  constructor() {
    // при смене комнаты — подключаемся к WS и загружаем историю
    effect(() => {
      const room = this.room();
      const location = this.location();
      if (!room) return;

      this.chatWebSocketService.connect(String(location.id), String(room.id));

      if (this.lastLoadedRoomId !== room.id) {
        this.lastLoadedRoomId = room.id;
        this.loadHistory(room.id);
        this.selectionService.clearSelection();
        this.scrollToBottom();
      }
    });

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

    // подключаем IntersectionObserver, как только сентинел появился в DOM
    effect(() => {
      const sentinel = this.bottomSentinel()?.nativeElement;
      const container = this.messagesEl()?.nativeElement;
      if (sentinel && container) {
        this.unreadTracker.attach(sentinel, container);
      }
    });

    // автоскролл на новые realtime-сообщения (от любого автора),
    // но только если юзер реально у низа ленты (по данным IntersectionObserver из tracker'а)
    effect(() => {
      const msgs = this.messages();
      const delta = msgs.length - this.lastMessagesCount;
      const isNewMessage = delta > 0;
      this.lastMessagesCount = msgs.length;

      if (!isNewMessage) return;
      if (this.unreadTracker.isAtBottom()) {
        this.scrollToBottom(delta > 1);
      }
    });

    // счётчик непрочитанных, когда мы в середине истории
    effect(() => {
      const msgs = this.messages();
      const isNewMessage = msgs.length > this.lastNotifiedMessagesCount;
      this.lastNotifiedMessagesCount = msgs.length;

      if (!isNewMessage) return;

      const lastMsg = msgs[msgs.length - 1];
      const myUserId = this.user()?.userId;
      if (isChatMessage(lastMsg) && lastMsg.character.userId !== myUserId) {
        this.unreadTracker.notifyLiveMessage();
      }
    });
  }

  isCharacterOnline(userId: number): boolean {
    return this.onlineIds().has(userId);
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

        // бэк уже посчитал и уже пометил прочитанным в getHistoryAndMarkRead —
        // отдаём готовое число, трекеру остаётся только визуал
        this.unreadTracker.setSnapshot(response.unreadCount);

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

  scrollToBottomFab(): void {
    this.scrollToBottom(); // просто вниз, без анализа dividerState — кнопка не должна возвращать наверх
  }

  sendMessage(text: string): void {
    this.chatWebSocketService.sendMessageWithSaveHistory(text, String(this.room().id));
    this.replyTo.set(null);
    this.scrollToBottom(true);
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
    return Array.from(this.typingUsers().values())[0] ?? '';
  }

  pluralizePeople(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'человек';
    if (mod10 === 1) return 'человек';
    if (mod10 >= 2 && mod10 <= 4) return 'человека';
    return 'человек';
  }

  private scrollToBottom(instant = false): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
      });
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

  ngOnDestroy(): void {
    if (this.readReportTimer) clearTimeout(this.readReportTimer);
    const room = this.room();
    const location = this.location();
    if (room && location) {
      this.chatWebSocketService.leaveRoom(String(location.id), String(room.id));
    }
  }
}