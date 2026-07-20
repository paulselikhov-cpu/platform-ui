import { Injectable, inject, signal } from '@angular/core';
import { MessageUnreadTrackerService } from './message-unread-tracker.service';
import { IChatMessageResponse } from '../../../../models/messages/message.interface';
import { MessageService } from '../../../../services/backend-services/http/message.service';

const PAGE_SIZE = 50;

@Injectable()
export class ChatRoomHistoryService {
  private readonly messageService = inject(MessageService);
  private readonly unreadTracker = inject(MessageUnreadTrackerService);

  /** Хранится в порядке "старые -> новые", как и нужно для рендера сверху вниз. */
  readonly history = signal<IChatMessageResponse[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);
  readonly firstUnreadMessageId = signal<number | null>(null);

  private roomId: number | null = null;
  private characterId: number | null = null;
  private currentPage = 0;

  load(roomId: number, characterId: number, onLoaded?: (hasUnread: boolean) => void): void {
    this.roomId = roomId;
    this.characterId = characterId;
    this.currentPage = 0;

    this.loading.set(true);
    this.history.set([]);
    this.firstUnreadMessageId.set(null);
    this.hasMore.set(true);

    this.messageService.getMessageHistory(roomId, characterId, 0, PAGE_SIZE).subscribe({
      next: (response) => {
        // ВАЖНО: проверь на бэке порядок сортировки внутри страницы.
        // Если page=0 отдаёт "новые -> старые" (типично для пагинации по времени DESC),
        // .reverse() обязателен, чтобы получить порядок "старые -> новые" для рендера.
        const ordered = [...response.messages].reverse();

        this.history.set(ordered);
        this.firstUnreadMessageId.set(response.firstUnreadMessageId);
        this.hasMore.set(response.messages.length === PAGE_SIZE);
        this.loading.set(false);

        this.unreadTracker.setSnapshot(response.unreadCount);
        onLoaded?.(response.firstUnreadMessageId != null);
      },
      error: () => this.loading.set(false),
    });
  }

  /** Подгружает следующую (более старую) страницу и добавляет её в начало ленты. */
  loadMore(onPrepended?: (addedCount: number) => void): void {
    if (this.loadingMore() || !this.hasMore() || this.roomId == null || this.characterId == null) {
      return;
    }

    const nextPage = this.currentPage + 1;
    this.loadingMore.set(true);

    this.messageService.getMessageHistory(this.roomId, this.characterId, nextPage, PAGE_SIZE).subscribe({
      next: (response) => {
        this.currentPage = nextPage;
        this.hasMore.set(response.messages.length === PAGE_SIZE);

        if (response.messages.length > 0) {
          const ordered = [...response.messages].reverse();
          this.history.set([...ordered, ...this.history()]);
        }

        this.loadingMore.set(false);
        onPrepended?.(response.messages.length);
      },
      error: () => this.loadingMore.set(false),
    });
  }
}