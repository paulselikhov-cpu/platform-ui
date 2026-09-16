import {
  Component, Injector, afterNextRender, effect, inject, input, viewChild,
} from '@angular/core';
import { IRoom } from '../../../../../models/location/location.interface';
import { isChatMessage, isSystemMessage } from '../../../../../type-guards/chat-message.guard';
import { AuthService } from '../../../../../services/backend-services/base/auth.service';
import { ChatWebSocketService } from '../../../../../services/backend-services/webSocket/chat-websocket.service';
import { MessageContextMenu, ContextMenuAction } from '../message-context-menu/message-context-menu';
import { MessageContextMenuService } from '../../services/message-context-menu.service';
import { MessageUnreadTrackerService } from '../../services/message-unread-tracker.service';
import { UnreadDivider } from '../unread-divider/unread-divider';
import { JumpToUnreadButton } from '../jump-to-unread-button/jump-to-unread-button';
import { ChatMessagesScrollDirective } from '../../directives/chat-messages-scroll.directive';
import { ChatRoomHistoryService } from '../../services/chat-room-history.service';
import { ChatMessagesService } from '../../services/chat-messages.service';
import { MessageArea } from '../message-area/message-area';

/**
 * Лента сообщений chat-area (по аналогии с ChatAreaHeader — вся специфика
 * ленты живёт здесь): история + realtime, автоскролл, разделитель непрочитанных,
 * кнопка «вниз», контекстное меню.
 *
 * Сервисы истории/сообщений/unread — providers родительского ChatArea,
 * поэтому компонент инжектит те же инстансы, что и родитель/message-input.
 */
@Component({
  selector: 'app-chat-area-messages',
  imports: [
    MessageArea, UnreadDivider, JumpToUnreadButton,
    MessageContextMenu, ChatMessagesScrollDirective,
  ],
  templateUrl: './chat-area-messages.html',
  styleUrl: './chat-area-messages.scss',
})
export class ChatAreaMessages {
  readonly room = input.required<IRoom>();
  readonly locationId = input.required<number>();
  readonly onlineIds = input.required<Set<number>>();

  private readonly auth = inject(AuthService);
  private readonly user = this.auth.currentUser;
  private readonly chatWebSocketService = inject(ChatWebSocketService);
  private readonly messageContextMenuService = inject(MessageContextMenuService);
  private readonly injector = inject(Injector);

  readonly unreadTracker = inject(MessageUnreadTrackerService);
  readonly historyService = inject(ChatRoomHistoryService);
  readonly messagesService = inject(ChatMessagesService);

  private readonly scrollCtrl = viewChild.required(ChatMessagesScrollDirective);

  readonly messageContextMenuState = this.messageContextMenuService.state;

  // прокси для шаблона — фактическое состояние живёт в сервисах
  readonly historyLoading = this.historyService.loading;
  readonly historyLoadingMore = this.historyService.loadingMore;
  readonly historyHasMore = this.historyService.hasMore;
  readonly firstUnreadMessageId = this.historyService.firstUnreadMessageId;
  readonly chatHistory = this.messagesService.chatHistory;
  readonly chatMessages = this.messagesService.chatMessages;

  // защита от повторной загрузки истории при лишних перезапусках effect()
  private lastLoadedRoomId: number | null = null;
  private lastRealtimeCount = 0;
  private lastNotifiedCount = 0;

  constructor() {
    // при смене комнаты — подключаемся к WS и грузим историю
    effect(() => {
      const room = this.room();
      this.chatWebSocketService.connect(String(this.locationId()), String(room.id));

      if (this.lastLoadedRoomId === room.id) return;
      this.lastLoadedRoomId = room.id;

      const characterId = this.user()?.userId;
      if (!characterId) return;

      this.historyService.load(room.id, characterId, (hasUnread) => {
        if (hasUnread) {
          this.scrollCtrl().scrollToUnreadDivider();
        } else {
          this.scrollCtrl().scrollToBottom(true); // телепорт, без анимации
        }
      });
    });

    // автоскролл на новые realtime-сообщения, если юзер у низа ленты
    effect(() => {
      const count = this.chatWebSocketService.messages().length;
      const delta = count - this.lastRealtimeCount;
      this.lastRealtimeCount = count;

      if (delta <= 0) return;
      if (this.unreadTracker.isAtBottom()) {
        this.scrollCtrl().scrollToBottom(delta > 1);
      }
    });

    // счётчик непрочитанных, когда мы в середине истории
    effect(() => {
      const msgs = this.chatWebSocketService.messages();
      const isNewMessage = msgs.length > this.lastNotifiedCount;
      this.lastNotifiedCount = msgs.length;
      if (!isNewMessage) return;

      const lastMsg = msgs[msgs.length - 1];
      const myUserId = this.user()?.userId;
      if (isChatMessage(lastMsg) && lastMsg.character.userId !== myUserId) {
        this.unreadTracker.notifyLiveMessage();
      }
    });
  }
  /** Вызывается директивой скролла, когда .top-sentinel попадает в зону видимости. */
  onNearTop(): void {
    if (this.historyService.loading()) return; // первая страница ещё грузится
    if (!this.historyService.hasMore() || this.historyService.loadingMore()) return;

    const restoreScroll = this.scrollCtrl().captureScrollAnchor();

    this.historyService.loadMore(() => {
      // ждём, пока Angular применит новые элементы к DOM, потом компенсируем scrollTop
      afterNextRender(() => restoreScroll(), { injector: this.injector });
    });
  }

  isCharacterOnline(userId: number): boolean {
    return this.onlineIds().has(userId);
  }

  onContextAction(action: ContextMenuAction): void {
    this.messagesService.onContextAction(action);
  }

  /** Публично: используется родителем (sendMessage) и кнопкой «вниз». */
  scrollToBottom(teleport = false): void {
    this.scrollCtrl().scrollToBottom(teleport);
  }

  scrollToBottomFab(): void {
    this.scrollCtrl().scrollToBottom(); // просто вниз, кнопка не должна возвращать наверх
  }

  isChatMessage = isChatMessage;
  isSystemMessage = isSystemMessage;
}

