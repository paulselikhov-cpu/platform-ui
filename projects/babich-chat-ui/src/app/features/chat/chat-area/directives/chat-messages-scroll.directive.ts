import { Directive, ElementRef, inject, AfterViewInit, OnDestroy } from '@angular/core';
import { MessageUnreadTrackerService } from '../services/message-unread-tracker.service';

/**
 * Директива на контейнер ленты сообщений (.chat-messages).
 * Инкапсулирует:
 *  - скролл вниз (instant/smooth) и скролл к unread-разделителю;
 *  - подключение IntersectionObserver трекера непрочитанных к статичному
 *    .bottom-sentinel внутри контейнера (без ручного viewChild + effect в компоненте).
 *
 * MessageUnreadTrackerService резолвится из providers родительского ChatArea —
 * директива и компонент используют один и тот же инстанс сервиса.
 */
@Directive({
  selector: '[chatMessagesScroll]',
  exportAs: 'chatScroll',
})
export class ChatMessagesScrollDirective implements AfterViewInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLDivElement>);
  private readonly unreadTracker = inject(MessageUnreadTrackerService);

  private pendingFrame: number | null = null;
  private pendingTimeout: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    // .bottom-sentinel — статичный элемент, не за @if, поэтому гарантированно в DOM
    // сразу после первого рендера; ручной effect-обвязки для этого не нужно.
    const sentinel = this.elementRef.nativeElement.querySelector('.bottom-sentinel');
    if (sentinel) {
      this.unreadTracker.attach(sentinel, this.elementRef.nativeElement);
    }
  }

  /** Скролл в самый низ ленты. instant=true — телепортом, без анимации (вход в комнату, отправка своего сообщения). */
  scrollToBottom(instant = false): void {
    this.runNextFrame(() => {
      const el = this.elementRef.nativeElement;
      el.scrollTo({ top: el.scrollHeight, behavior: instant ? 'auto' : 'smooth' });
    });
  }

  /** Скролл к разделителю непрочитанных (мгновенный — это тоже "вход в комнату", анимация тут не нужна). */
  scrollToUnreadDivider(): void {
    this.runNextFrame(() => {
      const divider = this.elementRef.nativeElement.querySelector('.unread-divider');
      divider?.scrollIntoView({ behavior: 'auto', block: 'center' });
    }, 50); // небольшая задержка: разделитель рендерится в этом же цикле CD
  }

  private runNextFrame(action: () => void, delay = 0): void {
    if (this.pendingFrame) cancelAnimationFrame(this.pendingFrame);
    if (this.pendingTimeout) clearTimeout(this.pendingTimeout);

    const schedule = () => (this.pendingFrame = requestAnimationFrame(action));
    if (delay > 0) {
      this.pendingTimeout = setTimeout(schedule, delay);
    } else {
      schedule();
    }
  }

  ngOnDestroy(): void {
    if (this.pendingFrame) cancelAnimationFrame(this.pendingFrame);
    if (this.pendingTimeout) clearTimeout(this.pendingTimeout);
  }
}