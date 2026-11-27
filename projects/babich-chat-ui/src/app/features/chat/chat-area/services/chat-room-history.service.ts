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
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly hasMore = signal(true);
  readonly firstUnreadMessageId = signal<number | null>(null);
  readonly error = signal(false);

  private roomId: number | null = null;
  private characterId: number | null = null;
  private currentPage = 0;
  private requestId = 0;

  load(roomId: number, characterId: number, onLoaded?: (hasUnread: boolean) => void): void {
    const requestId = ++this.requestId;
    this.roomId = roomId;
    this.characterId = characterId;
    this.currentPage = 0;

    this.loading.set(true);
    this.loadingMore.set(false);
    this.history.set([]);
    this.error.set(false);
    this.firstUnreadMessageId.set(null);
    this.hasMore.set(true);

    this.messageService.getMessageHistory(roomId, characterId, 0, PAGE_SIZE).subscribe({
      next: (response) => {
        if (requestId !== this.requestId) return;

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
      error: () => {
        if (requestId === this.requestId) {
          this.error.set(true);
          this.loading.set(false);
        }
      },
    });
  }

  /** Подгружает следующую (более старую) страницу и добавляет её в начало ленты. */
  loadMore(onPrepended?: (addedCount: number) => void): void {
    if (this.loadingMore() || !this.hasMore() || this.roomId == null || this.characterId == null) {
      return;
    }

    const nextPage = this.currentPage + 1;
    const requestId = this.requestId;
    const roomId = this.roomId;
    this.loadingMore.set(true);

    this.messageService.getMessageHistory(roomId, this.characterId, nextPage, PAGE_SIZE).subscribe({
      next: (response) => {
        if (requestId !== this.requestId || roomId !== this.roomId) return;

        this.currentPage = nextPage;
        this.hasMore.set(response.messages.length === PAGE_SIZE);

        if (response.messages.length > 0) {
          const ordered = [...response.messages].reverse();
          this.history.set([...ordered, ...this.history()]);
        }

        this.loadingMore.set(false);
        onPrepended?.(response.messages.length);
      },
      error: () => {
        if (requestId === this.requestId && roomId === this.roomId) {
          this.loadingMore.set(false);
        }
      },
    });
  }
}