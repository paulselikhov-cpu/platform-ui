import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { NotificationService } from './backend-services/http/notification.service';
import { CurrentChatUserService } from './current-chat-user.service';
import { INotification } from '../models/notification/notification.interface';
import { ApplicationStatus, ApplicationType } from '../models/economy/application.interface';

/**
 * Типы заявок, одобрение которых меняет данные ChatUser (паспорт/лицензия).
 * Для них при APPLICATION_RESULT + APPROVED перезагружаем профиль на UI.
 */
const APPLICATION_TYPES_THAT_UPDATE_CHARACTER: ApplicationType[] = [
  ApplicationType.REGISTER_PASSPORT,
  ApplicationType.REGISTER_WORK_LICENCE,
];

/**
 * Общее состояние счётчика непрочитанных уведомлений для бейджа у колокольчика.
 *
 * Источники:
 * - стартовое значение — GET /api/notifications/unread-count;
 * - живые уведомления (WS /user/queue/notifications) увеличивают счётчик;
 * - markRead/accept/decline уменьшают счётчик.
 *
 * Дополнительно (root-сервис, живёт всегда): на одобренную заявку типа,
 * меняющего ChatUser (паспорт/лицензия), перезагружает профиль текущего
 * персонажа — чтобы nav-rail (например, меню «Работа») разблокировалось без F5.
 */
@Injectable({ providedIn: 'root' })
export class NotificationUnreadService implements OnDestroy {
  private readonly notificationService = inject(NotificationService);
  private readonly currentChatUserService = inject(CurrentChatUserService);

  readonly count = signal(0);

  private liveSub: Subscription | null;

  constructor() {
    this.refresh();
    this.liveSub = this.notificationService.live$.subscribe({
      next: (n: INotification) => {
        if (!n.read) {
          this.count.update((c) => c + 1);
        }
        this.maybeRefreshChatUserOnApprovedApplication(n);
      },
      error: () => undefined,
    });
  }

  /**
   * Если пришло уведомление об одобренной заявке, которая меняет ChatUser,
   * и адресовано текущему персонажу — перезагружаем профиль.
   * Родственный путь — WS /user/queue/character-updated (CurrentChatUserService);
   * это работает даже если модалка уведомлений закрыта.
   */
  private maybeRefreshChatUserOnApprovedApplication(n: INotification): void {
    if (n.notificationType !== 'APPLICATION_RESULT') return;

    const ctx = n.data;
    if (!ctx || ctx.applicationStatus !== ApplicationStatus.APPROVED) return;
    if (!ctx.applicationType) return;
    if (!APPLICATION_TYPES_THAT_UPDATE_CHARACTER.includes(ctx.applicationType)) return;

    // уведомление уходит конкретному персонажу; обновляем только если это наш профиль
    const current = this.currentChatUserService.currentChatUser();
    if (!current || n.recipientCharacterId !== current.id) return;

    this.currentChatUserService.refresh();
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
