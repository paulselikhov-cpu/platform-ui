import { Injectable, inject, signal } from '@angular/core';
import { MessageUnreadTrackerService } from './message-unread-tracker.service';
import { IChatMessageResponse } from '../../../../models/messages/message.interface';
import { MessageService } from '../../../../services/backend-services/http/message.service';

/**
 * Загрузка истории комнаты из БД. Вызывается один раз при входе в комнату.
 * Свой инстанс на комнату (providers у ChatArea) — состояние не течёт между комнатами.
 */
@Injectable()
export class ChatRoomHistoryService {
  private readonly messageService = inject(MessageService);
  private readonly unreadTracker = inject(MessageUnreadTrackerService);

  readonly history = signal<IChatMessageResponse[]>([]);
  readonly loading = signal(false);
  readonly firstUnreadMessageId = signal<number | null>(null);

  /** onLoaded сообщает вызывающей стороне, были ли непрочитанные — нужно решить, куда скроллить. */
  load(roomId: number, characterId: number, onLoaded?: (hasUnread: boolean) => void): void {
    this.loading.set(true);
    this.history.set([]);
    this.firstUnreadMessageId.set(null);

    this.messageService.getMessageHistory(roomId, characterId).subscribe({
      next: (response) => {
        this.history.set(response.messages);
        this.firstUnreadMessageId.set(response.firstUnreadMessageId);
        this.loading.set(false);

        // бэк уже атомарно посчитал и пометил прочитанным в getHistoryAndMarkRead —
        // отдаём готовое число, трекеру остаётся только визуал
        this.unreadTracker.setSnapshot(response.unreadCount);
        onLoaded?.(response.firstUnreadMessageId != null);
      },
      error: () => this.loading.set(false),
    });
  }
}