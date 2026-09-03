import { Component, computed, input } from '@angular/core';

export type UnreadBadgeSize = 'sm' | 'md';

/**
 * Универсальный бейдж-счётчик непрочитанного (комнаты, уведомления и т.п.).
 * Скрывается, когда count <= 0. Числа > 99 показываются как "99+".
 */
@Component({
  selector: 'app-unread-badge',
  standalone: true,
  template: `
    @if (count() > 0) {
      <span class="unread-badge" [class.unread-badge--sm]="size() === 'sm'">
        {{ label() }}
      </span>
    }
  `,
  styleUrl: './unread-badge.scss',
})
export class UnreadBadge {
  readonly count = input.required<number>();
  readonly size = input<UnreadBadgeSize>('md');

  readonly label = computed(() => (this.count() > 99 ? '99+' : String(this.count())));
}
