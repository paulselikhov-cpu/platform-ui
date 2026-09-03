import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from './backend-services/http/notification.service';
import { INotification } from '../models/notification/notification.interface';

/**
 * Общее состояние счётчика непрочитанных уведомлений для бейджа у колокольчика.
 *
 * Источники:
 * - стартовое значение — GET /api/notifications/unread-count;
 * - живые уведомления (WS /user/queue/notifications) увеличивают счётчик;
 * - markRead/accept/decline уменьшают счётчик.
 */
@Injectable({ providedIn: 'root' })
export class NotificationUnreadService implements OnDestroy {
  private readonly notificationService = inject(NotificationService);

  readonly count = signal(0);

  private liveSub: Subscription | null;

  constructor() {
    this.refresh();
    this.liveSub = this.notificationService.live$.subscribe({
      next: (n: INotification) => {
        if (!n.read) {
          this.count.update((c) => c + 1);
        }
      },
      error: () => undefined,
    });
  }

  /** Перечитать число непрочитанных с сервера. */
  refresh(): void {
    this.notificationService.unreadCount().subscribe({
      next: (c) => this.count.set(c),
      error: () => undefined,
    });
  }

  /** Уменьшить счётчик на 1 (после прочтения/подтверждения действия). */
  decrement(): void {
    this.count.update((c) => Math.max(0, c - 1));
  }

  ngOnDestroy(): void {
    this.liveSub?.unsubscribe();
  }
}
