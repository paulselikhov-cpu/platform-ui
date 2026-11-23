import { Directive, ElementRef, NgZone, OnDestroy, inject, output } from '@angular/core';

/**
 * Свайп-назад от левого края экрана.
 *
 * Жест начинается только в узкой полосе у левого границы (24px), поэтому
 * обычная прокрутка ленты сообщений и горизонтальные списки (например
 * таблица выборов) жест не перехватывают. Срабатывание — при смещении вправо
 * длиннее 40px; смещение влево гасит жест, поэтому случайное касание не
 * выбрасывает из комнаты.
 *
 * События слушаются на document в фазе capture: палец может уйти за пределы
 * элемента (например на ленту сообщений), и жест всё равно должен завершиться.
 * Колбэк выполняется вне Angular — жест не участвует в отслеживании изменений.
 */
@Directive({
  selector: '[appSwipeBack]',
})
export class SwipeBackDirective implements OnDestroy {
  /** Выполняется при срабатывании жеста. */
  readonly swipeBack = output<void>();

  /** Отступ от левого края, с которого начинается жест, px. */
  private readonly edgeZone = 24;
  /** Смещение вправо для срабатывания, px. */
  private readonly threshold = 40;

  private readonly zone = inject(NgZone);
  private readonly document = inject(ElementRef<HTMLElement>).nativeElement.ownerDocument;

  private startX = 0;
  private startY = 0;
  private tracking = false;

  private readonly onTouchStart = (event: TouchEvent): void => {
    const touch = event.touches[0];
    if (!touch || touch.clientX > this.edgeZone) return;
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.tracking = true;
  };

  private readonly onTouchMove = (event: TouchEvent): void => {
    if (!this.tracking) return;
    const touch = event.touches[0];
    if (!touch) return;

    const dx = touch.clientX - this.startX;
    // Жест по вертикали — это прокрутка, а не возврат назад.
    if (Math.abs(touch.clientY - this.startY) > Math.abs(dx)) {
      this.tracking = false;
      return;
    }
    if (dx > this.threshold) {
      this.tracking = false;
      this.zone.run(() => this.swipeBack.emit());
    } else if (dx < -this.threshold) {
      // Потянули влево — отмена жеста, чтобы его можно было «отмотать» назад.
      this.tracking = false;
    }
  };

  private readonly onTouchEnd = (): void => {
    this.tracking = false;
  };

  constructor() {
    const opts: AddEventListenerOptions = { passive: true, capture: true };
    this.document.addEventListener('touchstart', this.onTouchStart, opts);
    this.document.addEventListener('touchmove', this.onTouchMove, opts);
    this.document.addEventListener('touchend', this.onTouchEnd, opts);
    this.document.addEventListener('touchcancel', this.onTouchEnd, opts);
  }

  ngOnDestroy(): void {
    const opts: EventListenerOptions = { capture: true };
    this.document.removeEventListener('touchstart', this.onTouchStart, opts);
    this.document.removeEventListener('touchmove', this.onTouchMove, opts);
    this.document.removeEventListener('touchend', this.onTouchEnd, opts);
    this.document.removeEventListener('touchcancel', this.onTouchEnd, opts);
  }
}