import { Component, DestroyRef, Injector, afterNextRender, computed, effect, inject, input, signal, viewChild, } from '@angular/core';
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
import { DayDivider } from '../day-divider/day-divider';
import {
  groupMessages,
  daySeparatorLabel,
  GroupedMessage,
  sortMessagesChronologically,
} from '../../utils/message-grouping.util';
import { IChatMessage } from '../../../../../models/messages/message.interface';

/**
 * Строка ленты: либо разделитель дней, либо сообщение с его положением
 * в группе автора. Лента рендерится одним циклом по этому типу, поэтому
 * разделитель не может «потеряться» между сообщениями.
 */
export type TimelineRow =
  | { readonly kind: 'day'; readonly label: string }
  | { readonly kind: 'message'; readonly item: GroupedMessage };

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
    MessageContextMenu, ChatMessagesScrollDirective, DayDivider,
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
  private readonly destroyRef = inject(DestroyRef);

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
  readonly historyError = this.historyService.error;
  readonly chatHistory = this.messagesService.chatHistory;
  readonly chatMessages = this.messagesService.chatMessages;
  private readonly readyHistoryRoomId = signal<number | null>(null);
  readonly historyReady = computed(
    () => this.readyHistoryRoomId() === this.room().id,
  );
  private readonly loadingIndicatorRoomId = signal<number | null>(null);
  readonly showHistoryLoading = computed(
    () => this.loadingIndicatorRoomId() === this.room().id && this.historyLoading(),
  );

  /**
   * История, разложенная по группам автора, с разделителями дней.
   * Разделители нужны в обеих лентах (история и realtime), поэтому история и
   * живые сообщения склеиваются в один список — иначе на границе между ними
   * «Сегодня» рисовалось бы дважды.
   */
  readonly groupedTimeline = computed(() => {
    const history = this.historyReady() ? this.chatHistory() : [];
    const live = this.chatMessages().filter(isChatMessage);
    const uniqueMessages = new Map<number, IChatMessage>();
    for (const message of [...history, ...live]) {
      uniqueMessages.set(message.id, message);
    }
    const all = sortMessagesChronologically([...uniqueMessages.values()]);
    const grouped: GroupedMessage[] = groupMessages(all);

    const rows: TimelineRow[] = [];
    let previousTimestamp: string | null = null;
    for (const item of grouped) {
      const label = daySeparatorLabel(item.message.timestamp, previousTimestamp);
      if (label != null) {
        rows.push({ kind: 'day', label });
      }
      rows.push({ kind: 'message', item });
      previousTimestamp = item.message.timestamp;
    }
    return rows;
  });
  // защита от повторной загрузки истории при лишних перезапусках effect()
  private lastLoadedRoomId: number | null = null;
  private lastRealtimeCount = 0;
  private lastNotifiedCount = 0;
  private readonly handleVisibilityChange = (): void => {
    if (
      document.visibilityState !== 'visible' ||
      (!this.historyLoading() && !this.historyError())
    ) {
      return;
    }

    const characterId = this.user()?.userId;
    if (characterId) {
      this.loadHistory(this.room(), characterId);
    }
  };

  constructor() {
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    });

    effect((onCleanup) => {
      const roomId = this.room().id;
      if (!this.historyLoading()) {
        this.loadingIndicatorRoomId.set(null);
        return;
      }

      this.loadingIndicatorRoomId.set(null);
      const timeoutId = setTimeout(() => {
        if (this.room().id === roomId) {
          this.loadingIndicatorRoomId.set(roomId);
        }
      }, 200);
      onCleanup(() => clearTimeout(timeoutId));
    });

    effect(() => {
      const roomId = this.room().id;
      const isHistoryLoading = this.historyLoading();
      if (this.lastLoadedRoomId === roomId && !isHistoryLoading) {
        this.readyHistoryRoomId.set(roomId);
      }
    });

    // при смене комнаты — подключаемся к WS и грузим историю
    effect(() => {
      const room = this.room();
      this.chatWebSocketService.connect(String(this.locationId()), String(room.id));

      if (this.lastLoadedRoomId === room.id) return;

      const characterId = this.user()?.userId;
      if (!characterId) return;

      this.lastLoadedRoomId = room.id;
      this.loadHistory(room, characterId);
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

  private loadHistory(room: IRoom, characterId: number): void {
    this.historyService.load(room.id, characterId, (hasUnread) => {
      if (hasUnread) {
        this.scrollCtrl().scrollToUnreadDivider();
      } else {
        this.scrollCtrl().scrollToBottom(true); // телепорт, без анимации
      }
    });
  }

  /**
   * Ключ строки для `@for`. Разделитель дня идентичен по индексу в списке,
   * сообщение — по своему id; вместе они стабильны при добавлении сообщений
   * в конец ленты (то есть DOM не пересоздаётся, автоскролл не сбивается).
   */
  trackRow(row: TimelineRow, index: number): string {
    return row.kind === 'day' ? `day-${index}` : `msg-${row.item.message.id}`;
  }

  /** Проекция сообщения во вход `MessageArea` (включая положение в группе). */
  toMessageArea(item: GroupedMessage) {
    const message = item.message;
    return {
      id: message.id,
      avatarName: message.character.characterName[0],
      sender: message.character.characterName,
      timestamp: message.timestamp,
      content: message.content,
      isDeleted: message.isDeleted,
      userId: message.character.userId,
      isOnline: this.isCharacterOnline(message.character.userId),
      replyTo: message.replyTo ?? null,
      isGroupStart: item.isGroupStart,
      isGroupEnd: item.isGroupEnd,
    };
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

