import { Directive, ElementRef, NgZone, OnDestroy, OnInit, inject } from '@angular/core';

@Directive({
  selector: '[appIosSafariViewport]',
})
export class IosSafariViewportDirective implements OnInit, OnDestroy {
  private readonly element = inject(ElementRef<HTMLElement>).nativeElement;
  private readonly zone = inject(NgZone);
  private viewport: VisualViewport | null = null;
  private active = false;

  private readonly updateViewport = (): void => {
    if (!this.active || !this.viewport) return;

    this.element.style.setProperty('--ios-safari-viewport-top', `${this.viewport.offsetTop}px`);
    this.element.style.setProperty('--ios-safari-viewport-height', `${this.viewport.height}px`);
  };

  private readonly onFocusIn = (event: FocusEvent): void => {
    if (this.isChatMessageInput(event.target)) {
      this.element.setAttribute('data-chat-input-focused', '');
    }
  };

  private readonly onFocusOut = (event: FocusEvent): void => {
    if (this.isChatMessageInput(event.target)) {
      this.element.removeAttribute('data-chat-input-focused');
    }
  };

  ngOnInit(): void {
    if (!this.isIosSafari() || typeof window === 'undefined') return;

    this.active = true;
    this.element.setAttribute('data-ios-safari', '');
    this.viewport = window.visualViewport;

    this.zone.runOutsideAngular(() => {
      window.addEventListener('resize', this.updateViewport);
      this.viewport?.addEventListener('resize', this.updateViewport);
      this.viewport?.addEventListener('scroll', this.updateViewport);
      this.element.addEventListener('focusin', this.onFocusIn);
      this.element.addEventListener('focusout', this.onFocusOut);
      this.updateViewport();
    });
  }

  ngOnDestroy(): void {
    if (!this.active || typeof window === 'undefined') return;

    window.removeEventListener('resize', this.updateViewport);
    this.viewport?.removeEventListener('resize', this.updateViewport);
    this.viewport?.removeEventListener('scroll', this.updateViewport);
    this.element.removeEventListener('focusin', this.onFocusIn);
    this.element.removeEventListener('focusout', this.onFocusOut);
    this.element.removeAttribute('data-ios-safari');
    this.element.removeAttribute('data-chat-input-focused');
    this.element.style.removeProperty('--ios-safari-viewport-top');
    this.element.style.removeProperty('--ios-safari-viewport-height');
  }

  private isChatMessageInput(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.matches('.chat-area .message-input__textarea');
  }

  private isIosSafari(): boolean {
    if (typeof navigator === 'undefined') return false;

    const userAgent = navigator.userAgent;
    const isIos =
      /iPhone|iPad|iPod/.test(userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafari =
      /Safari/.test(userAgent) &&
      !/(CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo)/.test(userAgent);

    return isIos && isSafari;
  }
}
