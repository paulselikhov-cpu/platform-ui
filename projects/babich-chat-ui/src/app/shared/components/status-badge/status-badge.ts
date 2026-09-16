import { Component, computed, input } from '@angular/core';
import { ApplicationStatus } from '../../../models/economy/application.interface';

export type StatusBadgeTone = 'pending' | 'approved' | 'rejected';

/** Человеко-понятные названия статусов заявок. */
export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  [ApplicationStatus.PENDING]: 'На рассмотрении',
  [ApplicationStatus.APPROVED]: 'Одобрено',
  [ApplicationStatus.REJECTED]: 'Отклонено',
};

/**
 * Универсальный бейдж статуса заявки (applicationStatus).
 * Показывает человеко-понятный статус с цветовой кодировкой.
 * Скрывается, когда статус не задан (не заявочное уведомление).
 */
@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.html',
  styleUrl: './status-badge.scss',
})
export class StatusBadge {
  /** Статус заявки (ApplicationStatus). null/undefined — бейдж не рендерится. */
  readonly status = input<ApplicationStatus | null | undefined>(null);

  readonly visible = computed(() => this.status() != null);
  readonly label = computed(() => {
    const s = this.status();
    return s ? STATUS_LABELS[s] ?? s : '';
  });
  readonly tone = computed((): StatusBadgeTone | '' => {
    switch (this.status()) {
      case ApplicationStatus.PENDING:
        return 'pending';
      case ApplicationStatus.APPROVED:
        return 'approved';
      case ApplicationStatus.REJECTED:
        return 'rejected';
      default:
        return '';
    }
  });
}
