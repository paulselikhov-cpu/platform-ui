import { Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

@Directive({
  selector: '[appDismissSearchFocus]',
  standalone: true,
})
/**
 * Снимает фокус с активного поля поиска при нажатии за его пределами.
 * data-search-input помечает как поисковое поле <input type="text">, например поиск людей/комнат и эмодзи. Директива DismissSearchFocusDirective распознаёт этот атрибут и снимает фокус, если нажать вне поля.
 * 
 *  Для <input type="search"> атрибут не нужен: директива распознаёт их по типу.
 *
 */
export class DismissSearchFocusDirective implements OnDestroy {
  private readonly document = inject(ElementRef<HTMLElement>).nativeElement.ownerDocument;
  private readonly zone = inject(NgZone);

  private readonly onPointerDown = (event: PointerEvent): void => {
    const view = this.document.defaultView;
    const activeElement = this.document.activeElement;

    if (
      !view ||
      !(activeElement instanceof view.HTMLInputElement) ||
      (activeElement.type !== 'search' && !activeElement.hasAttribute('data-search-input'))
    ) {
      return;
    }

    if (event.target instanceof view.Node && activeElement.contains(event.target)) return;
    activeElement.blur();
  };

  constructor() {
    this.zone.runOutsideAngular(() => {
      this.document.addEventListener('pointerdown', this.onPointerDown, true);
    });
  }

  ngOnDestroy(): void {
    this.document.removeEventListener('pointerdown', this.onPointerDown, true);
  }
}
