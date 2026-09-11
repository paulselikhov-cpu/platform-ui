import { Component, input, inject, effect, viewChild, OnDestroy, Injector, afterNextRender, signal } from '@angular/core';
import { ILocation, IRoom, RoomCode } from '../../../models/location/location.interface';
import { MessageContextMenu, ContextMenuAction } from './components/message-context-menu/message-context-menu';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { IChatMessage, IChatMessageResponse } from '../../../models/messages/message.interface';
import { isChatMessage, isSystemMessage } from '../../../type-guards/chat-message.guard';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { ChatWebSocketService } from '../../../services/backend-services/webSocket/chat-websocket.service';
import { MessageContextMenuService } from './services/message-context-menu.service';
import { MessageSelectionService } from './services/message-selection.service';
import { MessageUnreadTrackerService } from './services/message-unread-tracker.service';
import { UnreadDivider } from './components/unread-divider/unread-divider';
import { JumpToUnreadButton } from './components/jump-to-unread-button/jump-to-unread-button';
import { ChatMessagesScrollDirective } from './directives/chat-messages-scroll.directive';
import { ChatRoomHistoryService } from './services/chat-room-history.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { MessageArea } from './components/message-area/message-area';
import { SelectionToolbar } from './components/selection-toolbar/selection-toolbar';
import { LocationPresenceState } from '../../location/location-view/services/online-tracking.service';
import { ElectionTable } from '../../../shared/components/election-table/election-table';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { ElectionService } from '../../../services/backend-services/http/election.service';
import { IElectionOverview, PollStatus } from '../../../models/poll/election.interface';
import { GovernorsAdminMenu } from './components/governors-admin-menu/governors-admin-menu';
import { LocationPostService } from '../../../services/backend-services/http/location-post.service';
import { LocationPostType } from '../../../models/location-post/location-post.interface';
import { ReceptionMenu } from './components/reception-menu/reception-menu';
import { ChatAreaHeader } from './chat-area/chat-area-header/chat-area-header';

@Component({
  selector: 'app-chat-area',
  imports: [
    MessageInput, MessageContextMenu, SelectionToolbar, MessageArea,
    UnreadDivider, JumpToUnreadButton, ChatMessagesScrollDirective,
    ElectionTable, GovernorsAdminMenu, ReceptionMenu, ChatAreaHeader,
],
  // свой инстанс каждого сервиса на комнату (на каждый ChatArea)
  providers: [MessageUnreadTrackerService, ChatRoomHistoryService, ChatMessagesService],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea implements OnDestroy {
  readonly room = input.required<IRoom>();
  readonly location = input.required<ILocation>();
  readonly onlineIds = input.required<Set<number>>();
  readonly onlineState = input.required<LocationPresenceState | null>();
  readonly rooms = input.required<IRoom[]>();

  private readonly auth = inject(AuthService);
  private readonly user = this.auth.currentUser;
  private readonly chatWebSocketService = inject(ChatWebSocketService);
  private readonly messageContextMenuService = inject(MessageContextMenuService);
  private readonly injector = inject(Injector);
  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly electionService = inject(ElectionService);
  private readonly locationPostService = inject(LocationPostService);

  readonly selectionService = inject(MessageSelectionService);
  readonly messageContextMenuState = this.messageContextMenuService.state;
  readonly unreadTracker = inject(MessageUnreadTrackerService);

  readonly historyService = inject(ChatRoomHistoryService);
  readonly messagesService = inject(ChatMessagesService);

  private readonly scrollCtrl = viewChild.required(ChatMessagesScrollDirective);

  readonly connected = this.chatWebSocketService.connected;
  readonly typingUsers = this.chatWebSocketService.typingUsers;

  // прокси для шаблона — фактическое состояние живёт в сервисах
  readonly historyLoading = this.historyService.loading;
  readonly historyLoadingMore = this.historyService.loadingMore;
  readonly historyHasMore = this.historyService.hasMore;
  readonly firstUnreadMessageId = this.historyService.firstUnreadMessageId;
  readonly chatHistory = this.messagesService.chatHistory;
  readonly chatMessages = this.messagesService.chatMessages;
  readonly systemMessages = this.messagesService.systemMessages;

  // защита от повторной загрузки истории при лишних перезапусках effect()
  private lastLoadedRoomId: number | null = null;
  private lastRealtimeCount = 0;
  private lastNotifiedCount = 0;

  constructor() {
    // должности в текущей локации — для проверки «текущий пользователь — губернатор»
    effect(() => {
      const location = this.location();
      if (location?.id == null) return;
      this.locationPostService.getPostsByLocation(location.id).subscribe({
        next: (posts) => {
          const governor = posts.find((p) => p.post === LocationPostType.GOVERNOR);
          this.governorCharacterId.set(governor?.characterId ?? null);
        },
        error: () => this.governorCharacterId.set(null),
      });
    });

    // при смене комнаты — подключаемся к WS и грузим историю
    effect(() => {
      const room = this.room();
      const location = this.location();

      this.chatWebSocketService.connect(String(location.id), String(room.id));

      if (this.lastLoadedRoomId === room.id) return;
      this.lastLoadedRoomId = room.id;
      this.selectionService.clearSelection();

      const characterId = this.user()?.userId; // подставьте реальный источник characterId
      if (!characterId) return;

      this.historyService.load(room.id, characterId, (hasUnread) => {
        if (hasUnread) {
          this.scrollCtrl().scrollToUnreadDivider();
        } else {
          this.scrollCtrl().scrollToBottom(true); // телепорт, без анимации
        }
      });
    });

    // автоскролл на новые realtime-сообщения (от любого автора),
    // но только если юзер реально у низа ленты
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

    // Поллинг состояния выборов губернатора — только на Площади Ленина (комната «Площадь»)
    effect((onCleanup) => {
      // читаем сигналы (комната/локация), чтобы effect перезапускался при их смене
      this.room();
      this.location();
      this.currentUserService.currentChatUser();
      if (!this.isLeninSquareRoom()) return;

      this.refreshElection();
      const id = setInterval(() => this.refreshElection(), 8000);
      onCleanup(() => clearInterval(id));
    });
  }

  /** Вызывается директивой скролла, когда .top-sentinel попадает в зону видимости. */
  onNearTop(): void {
    if (this.historyService.loading()) return; // первая страница ещё грузится
    if (!this.historyService.hasMore() || this.historyService.loadingMore()) return;

    const restoreScroll = this.scrollCtrl().captureScrollAnchor();

    this.historyService.loadMore(() => {
      // ждём, пока Angular реально применит новые элементы к DOM,
      // и только потом компенсируем scrollTop
      afterNextRender(() => restoreScroll(), { injector: this.injector });
    });
  }

  isCharacterOnline(userId: number): boolean {
    return this.onlineIds().has(userId);
  }

  onContextAction(action: ContextMenuAction): void {
    this.messagesService.onContextAction(action);
  }

  onDeleteSelected(ids: number[]): void {
    this.messagesService.deleteSelected(ids);
  }

  onCopySelected(ids: number[]): void {
    this.messagesService.copySelected(ids);
  }

  cancelReply(): void {
    this.messagesService.cancelReply();
  }

  scrollToBottomFab(): void {
    this.scrollCtrl().scrollToBottom(); // просто вниз, кнопка не должна возвращать наверх
  }

  sendMessage(text: string): void {
    const replyToId = this.messagesService.replyTo()?.id;
    this.chatWebSocketService.sendMessageWithSaveHistory(text, String(this.room().id), replyToId);
    this.messagesService.cancelReply();
    this.scrollCtrl().scrollToBottom(true);
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

  isChatMessage = isChatMessage;
  isSystemMessage = isSystemMessage;

  getAllMessages(): IChatMessage[] {
    return this.messagesService.allMessages().filter(isChatMessage);
  }

  //Какая комната текущая
  isGovernorsOfficeRoom(): boolean {
    return this.room().code === RoomCode.GOVERNORS_OFFICE;
  }

  isReceptions(): boolean {
    return this.room().code === RoomCode.RECEPTION;
  }

  isLeninSquareRoom(): boolean {
    return this.room().code === RoomCode.LENIN_SQUARE;
  }

  /** Текущий персонаж занимает должность губернатора (GOVERNOR) в этой локации. */
  currentUserIsGovernor(): boolean {
    const myCharacterId = this.currentUserService.currentChatUser()?.id ?? null;
    return myCharacterId != null && this.governorCharacterId() === myCharacterId;
  }

  // ─── Выборы губернатора (сценарий №2): состояние ─────────────────────────
  readonly electionOverview = signal<IElectionOverview | null>(null); // Проекция состояния выборов района
  readonly electionLoading = signal(false);

  /** characterId персонажа на должности GOVERNOR в этой локации (null — вакансия или ещё не загружено). */
  private readonly governorCharacterId = signal<number | null>(null);

  refreshElection(): void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) return;
    this.electionLoading.set(true);
    this.electionService.getOverview(districtId).subscribe({
      next: (overview) => {
        this.electionOverview.set(overview);
        this.electionLoading.set(false);
      },
      error: () => {
        // не зануляем последние удачные данные — транзиентная ошибка не должна
        // прятать таблицу (иначе после F5 первый сбой оставляет её пустой)
        this.electionLoading.set(false);
        console.log({ kind: 'error', text: 'Не удалось загрузить данные о выборах' })
      },
    });
  }

  ngOnDestroy(): void {
    const room = this.room();
    const location = this.location();
    if (room && location) {
      this.chatWebSocketService.leaveRoom(String(location.id), String(room.id));
    }
  }
}