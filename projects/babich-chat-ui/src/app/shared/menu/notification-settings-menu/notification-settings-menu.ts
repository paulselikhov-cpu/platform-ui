import { Component, inject, OnDestroy, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/backend-services/http/notification.service';
import { NotificationUnreadService } from '../../../services/notification-unread.service';
import { INotification } from '../../../models/notification/notification.interface';

@Component({
  selector: 'app-notification-settings-menu',
  templateUrl: './notification-settings-menu.html',
  styleUrl: './notification-settings-menu.scss',
  standalone: true,
})
export class NotificationSettingsMenu implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationUnreadService = inject(NotificationUnreadService);

  readonly notifications = signal<INotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private liveSub: Subscription | null = null;

  constructor() {
    this.load();
    // синхронизируем бейдж у колокольчика при открытии
    this.notificationUnreadService.refresh();
    // Живые уведомления (WS-пуш от бэка на события выборов/заявок)
    this.liveSub = this.notificationService.live$.subscribe({
      next: (n) => {
        this.notifications.update((prev) =>
          [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 100),
        );
      },
      error: () => undefined,
    });
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notificationService.list().subscribe({
      next: (list) => {
        this.notifications.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('Не удалось загрузить уведомления');
      },
    });
  }

  markRead(n: INotification): void {
    if (n.read) return;
    this.notificationService.markRead(n.id).subscribe({
      next: () => {
        this.notifications.update((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
        );
        this.notificationUnreadService.decrement();
      },
    });
  }

  acceptAction(n: INotification): void {
    const wasUnread = !n.read;
    this.notificationService.accept(n.id).subscribe({
      next: () => {
        this.notifications.update((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read: true, actionStatus: 'ACCEPTED' } : x,
          ),
        );
        if (wasUnread) {
          this.notificationUnreadService.decrement();
        }
      },
    });
  }

  declineAction(n: INotification): void {
    const wasUnread = !n.read;
    this.notificationService.decline(n.id).subscribe({
      next: () => {
        this.notifications.update((prev) =>
          prev.map((x) =>
            x.id === n.id ? { ...x, read: true, actionStatus: 'DECLINED' } : x,
          ),
        );
        if (wasUnread) {
          this.notificationUnreadService.decrement();
        }
      },
    });
  }

  typeLabel(n: INotification): string {
    switch (n.notificationType) {
      case 'ELECTION_STARTED':
        return 'Выборы';
      case 'ELECTION_RESULT':
        return 'Результат выборов';
      case 'APPLICATION_RESULT':
        return 'Заявка';
      default:
        return 'Система';
    }
  }

  ngOnDestroy(): void {
    this.liveSub?.unsubscribe();
  }
}