import { Component, inject, OnDestroy, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../services/backend-services/http/notification.service';
import { NotificationUnreadService } from '../../../services/notification-unread.service';
import { INotification } from '../../../models/notification/notification.interface';
import { ApplicationStatus } from '../../../models/economy/application.interface';
import { StatusBadge } from '../../components/status-badge/status-badge';

@Component({
  selector: 'app-my-notifications-menu',
  templateUrl: './my-notifications-menu.html',
  styleUrl: './my-notifications-menu.scss',
  standalone: true,
  imports: [StatusBadge],
})
export class NotificationSettingsMenu implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly notificationUnreadService = inject(NotificationUnreadService);
  private readonly router = inject(Router);

  /** Закрыть окно уведомлений (после перехода по ссылке). */
  readonly close = output<void>();

  readonly notifications = signal<INotification[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  private liveSub: Subscription | null = null;

  constructor() {
    console.log('open-noti')
    this.load();
    // синхронизируем бейдж у колокольчика при открытии
    this.notificationUnreadService.refresh();
    // Живые уведомления (WS-пуш от бэка на события выборов/заявок)
    this.liveSub = this.notificationService.live$.subscribe({
      next: (n) => {
        console.log('noti', n)
        // Реакция на одобренные заявки (перезагрузка currentChatUser при
        // паспорте/лицензии) живёт в NotificationUnreadService (root) — она
        // срабатывает, даже когда эта модалка закрыта.
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

  /**
   * Ссылка перехода для уведомления о выборах: `location/:code/feature/:screenId`.
   * Код площади Ленина и id экрана приходят из `data` (бэк не хардкодит их на
   * фронте, а резолвит площадь по району). null — переходить некуда.
   */
  electionLink(n: INotification): string[] | null { // TODO проверить работоспособность
    if (n.notificationType !== 'ELECTION_STARTED') return null;
    const code = n.data?.electionLocationCode;
    const featureId = n.data?.electionFeatureId;
    if (!code || !featureId) return null;
    return ['/chat/location', String(code), 'feature', String(featureId)];
  }

  /** Перейти к экрану выборов и закрыть окно уведомлений. */
  goToElection(n: INotification): void { // TODO проверить работоспособность
    const link = this.electionLink(n);
    if (!link) return;
    this.markRead(n);
    this.close.emit();
    this.router.navigate(link);
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

  /** Статус заявки из контекстных данных (только для APPLICATION_RESULT). */
  statusOf(n: INotification): ApplicationStatus | null {
    const s = n.data?.applicationStatus;
    return s && Object.values(ApplicationStatus).includes(s) ? s : null;
  }

  ngOnDestroy(): void {
    console.log('destroy-noti')
    this.liveSub?.unsubscribe();
  }
}