import { Component, computed, input, signal } from '@angular/core';
import { Observable } from 'rxjs';
import { ConfirmModal } from '../modals/confirm-modal/confirm-modal';
import { RoomMenuItem } from './room-menu-item.interface';

/**
 * Универсальное выпадающее меню «⚡ Действия» в шапке чата.
 * Рисует пункты, переданные фичей комнаты (RoomFeature.menuItems), и
 * при необходимости показывает ConfirmModal перед выполнением.
 * Никакой специфики комнат внутри — только рендер и оркестрация подтверждения.
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

  close(): void {
    this.open.set(false);
  }

  select(item: RoomMenuItem): void {
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

