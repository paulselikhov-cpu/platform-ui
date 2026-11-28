import { Component, HostListener, computed, input, output, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmModal } from '../modals/confirm-modal/confirm-modal';
import { RoomMenuItem } from './room-menu-item.interface';
import type { DefaultSize } from '../default-base';

/**
 * Контекстное меню — пункты, переданные владельцем (`RoomMenuItem[]`),
 * и подтверждение перед опасным действием.
 *
 * Два режима:
 *  - с кнопкой «⋮» (по умолчанию) — выпадает под кнопкой;
 *  - без кнопки (`showTrigger = false`) — владелец сам вызывает `openAt(x, y)`,
 *    например по правому клику или долгому нажатию (контекстное меню).
 *
 * Никакой специфики локаций/комнат внутри — только рендер, закрытие по клику
 * вне и по Escape, и подтверждение действия.
 */
@Component({
  selector: 'app-actions-menu',
  imports: [ConfirmModal],
  templateUrl: './actions-menu.html',
  styleUrl: './actions-menu.scss',
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class ActionsMenu {
  readonly size = input<DefaultSize>('m');

  /** Все пункты меню (с учётом visible()). */
  readonly menuItems = input.required<RoomMenuItem[]>();

  /** Рисовать ли кнопку «⋮». Для контекстного меню выключается. */
  readonly showTrigger = input(true);

  readonly open = signal(false);
  readonly closed = output<void>();

  /** Точка на экране, у которой открыто контекстное меню (null — под кнопкой). */
  readonly anchor = signal<{ x: number; y: number } | null>(null);

  readonly pendingConfirm = signal<RoomMenuItem | null>(null);
  readonly confirmLoading = signal(false);

  /** Видимые пункты — computed, чтобы фильтр по visible() был реактивным. */
  readonly items = computed(() => this.menuItems().filter((item) => item.visible?.() ?? true));

  toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.anchor.set(null);
      this.open.set(true);
    }
  }

  /** Открыть меню в точке экрана, не давая ему выйти за границы окна. */
  openAt(x: number, y: number): void {
    const margin = 8;
    const menuWidth = 240; // приблизительно: min 200px, max 280px
    const menuHeight = this.items().length * 46 + 8;

    this.anchor.set({
      x: Math.max(margin, Math.min(x, window.innerWidth - menuWidth - margin)),
      y: Math.max(margin, Math.min(y, window.innerHeight - menuHeight - margin)),
    });
    this.open.set(true);
  }

  /** Escape закрывает открытое меню — стандартное поведение выпадающих списков. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void {
    this.open.set(false);
    this.anchor.set(null);
  }

  select(item: RoomMenuItem): void {
    if (item.disabled) return;
    this.close();
    if (item.confirm) {
      this.pendingConfirm.set(item);
    } else {
      this.execute(item);
    }
  }

  onConfirmed(): void {
    const item = this.pendingConfirm();
    if (item) this.execute(item);
  }

  onCancelled(): void {
    this.pendingConfirm.set(null);
  }

  private execute(item: RoomMenuItem): void {
    const result = item.run();
    if (!result) {
      this.finishConfirm();
      return;
    }
    if (typeof (result as Observable<unknown>).subscribe === 'function') {
      this.confirmLoading.set(true);
      (result as Observable<unknown>).subscribe({
        next: () => this.finishConfirm(),
        error: () => this.finishConfirm(),
      });
    } else if (result instanceof Promise) {
      this.confirmLoading.set(true);
      result.then(
        () => this.finishConfirm(),
        () => this.finishConfirm(),
      );
    }
  }

  private finishConfirm(): void {
    this.confirmLoading.set(false);
    this.pendingConfirm.set(null);
  }
}