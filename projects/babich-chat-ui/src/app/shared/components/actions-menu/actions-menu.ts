import { Component, HostListener, computed, input, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmModal } from '../modals/confirm-modal/confirm-modal';
import { RoomMenuItem } from './room-menu-item.interface';
import { DefaultButtonComponent } from '../buttons/default-button/default-button';

/**
 * Переполняющее меню «⋮» — пункты, переданные владельцем
 * (`RoomMenuItem[]`), и подтверждение перед опасным действием.
 *
 * Рендерится одинаково на десктопе и мобиле; источник пунктов всегда один —
 * то, что открыто сейчас (фича локации либо комната), поэтому `⋮` вне локации
 * не показывается. Никакой специфики локаций/комнат внутри — только рендер,
 * закрытие по клику вне и по Escape, и подтверждение действия.
 */
@Component({
  selector: 'app-actions-menu',
  imports: [ConfirmModal],
  templateUrl: './actions-menu.html',
  styleUrl: './actions-menu.scss',
})
export class ActionsMenu {
  /** Все пункты меню (с учётом visible()). */
  readonly menuItems = input.required<RoomMenuItem[]>();

  readonly open = signal(false);
  readonly pendingConfirm = signal<RoomMenuItem | null>(null);
  readonly confirmLoading = signal(false);

  /** Видимые пункты — computed, чтобы фильтр по visible() был реактивным. */
  readonly items = computed(() => this.menuItems().filter((item) => item.visible?.() ?? true));

  toggle(): void {
    this.open.update((v) => !v);
  }

  /** Escape закрывает открытое меню — стандартное поведение выпадающих списков. */
  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) this.close();
  }

  close(): void {
    this.open.set(false);
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

