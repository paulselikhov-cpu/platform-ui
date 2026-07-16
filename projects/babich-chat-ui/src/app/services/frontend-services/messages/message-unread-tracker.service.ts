import { Injectable, signal, OnDestroy } from '@angular/core';

export type UnreadDividerState = 'visible' | 'confirming' | 'gone';

@Injectable() // НЕ providedIn: 'root' — регистрируется в providers у ChatArea, свой инстанс на комнату
export class MessageUnreadTrackerService implements OnDestroy {
  readonly dividerState = signal<UnreadDividerState>('gone');
  readonly unreadCount = signal(0);
  readonly showJumpButton = signal(false);

  private observer: IntersectionObserver | null = null;
  private dwellTimer: ReturnType<typeof setTimeout> | null = null;
  private sentinelEl: HTMLElement | null = null;
  private containerEl: HTMLElement | null = null;

  /**
   * Вызывается один раз после ответа getHistoryAndMarkRead — бэк уже
   * посчитал и уже пометил комнату прочитанной в БД, тут только визуал.
   */
  setSnapshot(unreadCount: number): void {
    this.clearDwellTimer();

    if (unreadCount > 0) {
      this.unreadCount.set(unreadCount);
      this.dividerState.set('visible');
      this.checkVisibilityNow();
    } else {
      this.unreadCount.set(0);
      this.dividerState.set('gone');
      this.showJumpButton.set(false);
    }
  }

  /** Подключить сентинел низа ленты. Можно звать повторно — старый observer отключится. */
  attach(sentinel: HTMLElement, container: HTMLElement): void {
    this.sentinelEl = sentinel;
    this.containerEl = container;
    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries[0]?.isIntersecting ?? false),
      { threshold: 1.0, rootMargin: '0px' },
    );
    this.observer.observe(sentinel);

    // не ждём будущего пересечения — проверяем сразу (случай "сообщений мало, всё влезает")
    this.checkVisibilityNow();
  }

  private checkVisibilityNow(): void {
    if (!this.sentinelEl || !this.containerEl) return;
    const s = this.sentinelEl.getBoundingClientRect();
    const c = this.containerEl.getBoundingClientRect();
    const isVisible = s.top < c.bottom && s.bottom > c.top;
    this.handleIntersection(isVisible);
  }

  private handleIntersection(isVisible: boolean): void {
    if (isVisible && this.dividerState() === 'visible' && this.unreadCount() > 0) {
      this.dwellTimer ??= setTimeout(() => this.playReadAnimation(), 800);
    } else {
      this.clearDwellTimer();
    }
    this.showJumpButton.set(!isVisible && this.dividerState() === 'visible' && this.unreadCount() > 0);
  }

  private playReadAnimation(): void {
    this.clearDwellTimer();
    this.dividerState.set('confirming');
    setTimeout(() => {
      this.dividerState.set('gone');
      this.showJumpButton.set(false);
    }, 1600);
  }

  private clearDwellTimer(): void {
    if (this.dwellTimer) {
      clearTimeout(this.dwellTimer);
      this.dwellTimer = null;
    }
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.clearDwellTimer();
  }
}