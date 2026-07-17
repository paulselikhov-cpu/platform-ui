import { Injectable, signal, OnDestroy, computed } from '@angular/core';

export type UnreadDividerState = 'visible' | 'confirming' | 'gone';

@Injectable() // НЕ providedIn: 'root' — регистрируется в providers у ChatArea, свой инстанс на комнату
export class MessageUnreadTrackerService implements OnDestroy {
  readonly dividerState = signal<UnreadDividerState>('gone');
  readonly unreadCount = signal(0);
  readonly liveUnseenCount = signal(0);
  readonly isAtBottom = signal(true); // ← новое: единый источник правды о позиции скролла

  readonly showJumpButton = computed(() =>
    (this.dividerState() === 'visible' && this.unreadCount() > 0) || this.liveUnseenCount() > 0
  );

  readonly jumpButtonCount = computed(() => this.unreadCount() + this.liveUnseenCount());

  private observer: IntersectionObserver | null = null;
  private dwellTimer: ReturnType<typeof setTimeout> | null = null;
  private sentinelEl: HTMLElement | null = null;
  private containerEl: HTMLElement | null = null;

  setSnapshot(unreadCount: number): void {
    this.clearDwellTimer();
    if (unreadCount > 0) {
      this.unreadCount.set(unreadCount);
      this.dividerState.set('visible');
      this.checkVisibilityNow();
    } else {
      this.unreadCount.set(0);
      this.dividerState.set('gone');
    }
  }

  attach(sentinel: HTMLElement, container: HTMLElement): void {
    this.sentinelEl = sentinel;
    this.containerEl = container;
    this.observer?.disconnect();

    this.observer = new IntersectionObserver(
      (entries) => this.handleIntersection(entries[0]?.isIntersecting ?? false),
      { threshold: 1.0, rootMargin: '0px' },
    );
    this.observer.observe(sentinel);
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
    this.isAtBottom.set(isVisible); // ← публичный сигнал вместо приватного поля

    if (isVisible && this.dividerState() === 'visible' && this.unreadCount() > 0) {
      this.dwellTimer ??= setTimeout(() => this.playReadAnimation(), 800);
    } else if (!isVisible) {
      this.clearDwellTimer();
    }

    if (isVisible && this.liveUnseenCount() > 0) {
      this.liveUnseenCount.set(0);
    }
  }

  notifyLiveMessage(): void {
    if (!this.isAtBottom()) {
      this.liveUnseenCount.update(c => c + 1);
    }
  }

  private playReadAnimation(): void {
    this.clearDwellTimer();
    this.dividerState.set('confirming');
    setTimeout(() => {
      this.dividerState.set('gone');
      this.unreadCount.set(0); // фикс бага "45" — старый снапшот больше не в счёт
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