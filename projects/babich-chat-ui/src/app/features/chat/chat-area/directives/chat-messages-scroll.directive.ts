import {
  Directive,
  ElementRef,
  inject,
  AfterViewInit,
  OnDestroy,
  output,
} from '@angular/core';
import { MessageUnreadTrackerService } from '../services/message-unread-tracker.service';

/**
 * Директива на контейнер ленты сообщений (.chat-messages).
 * Инкапсулирует:
 *  - скролл вниз (instant/smooth) и скролл к unread-разделителю;
 *  - подключение IntersectionObserver трекера непрочитанных к статичному
 *    .bottom-sentinel внутри контейнера;
 *  - подключение IntersectionObserver к статичному .top-sentinel —
 *    для подгрузки истории при прокрутке вверх (nearTop output);
 *  - сохранение/восстановление визуальной позиции скролла при подгрузке
 *    сообщений в начало ленты (чтобы не "прыгало").
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
  private topObserver: IntersectionObserver | null = null;

  /** Эмитится, когда .top-sentinel попадает в область видимости контейнера. */
  readonly nearTop = output<void>();

  ngAfterViewInit(): void {
    const root = this.elementRef.nativeElement;

    // .bottom-sentinel — статичный элемент, не за @if, поэтому гарантированно в DOM
    // сразу после первого рендера.
    const bottomSentinel = root.querySelector('.bottom-sentinel');
    if (bottomSentinel) {
      this.unreadTracker.attach(bottomSentinel, root);
    }

    // .top-sentinel — тоже статичный элемент, первый в контейнере.
    const topSentinel = root.querySelector('.top-sentinel');
    if (topSentinel) {
      this.topObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            this.nearTop.emit();
          }
        },
        {
          root,
          // подгружаем чуть заранее, до того как sentinel реально станет видимым
          rootMargin: '150px 0px 0px 0px',
          threshold: 0,
        },
      );
      this.topObserver.observe(topSentinel);
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

  /**
   * Снимает "снимок" scrollTop/scrollHeight ДО того, как в начало ленты
   * добавятся более старые сообщения. Возвращает функцию, которую нужно
   * вызвать ПОСЛЕ того, как Angular реально отрисовал новые элементы в DOM
   * (например, через afterNextRender) — она восстановит визуальную позицию,
   * компенсируя выросшую scrollHeight, чтобы лента не "прыгала".
   */
  captureScrollAnchor(): () => void {
    const el = this.elementRef.nativeElement;
    const scrollTopBefore = el.scrollTop;
    const scrollHeightBefore = el.scrollHeight;

    return () => {
      const delta = el.scrollHeight - scrollHeightBefore;
      el.scrollTop = scrollTopBefore + delta;
    };
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
    this.topObserver?.disconnect();
  }
}