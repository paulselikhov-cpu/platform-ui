import { inject, Injectable, signal } from '@angular/core';
import { RoomFeature, RoomFeatureContext } from './room-feature.interface';
import { resolveRoomFeature } from './room-feature.factory';

/**
 * Хранит активную фичу комнаты. Состояние переживает переключение вкладок
 * внутри одной комнаты, но сбрасывается при смене комнаты.
 */
@Injectable({ providedIn: 'root' })
export class RoomFeatureStore {
  private readonly feature = signal<RoomFeature | null>(null);
  private readonly teardown = signal<(() => void) | null>(null);

  readonly activeFeature = this.feature.asReadonly();

  /** Активировать фичу для комнаты. Вызывается при входе в комнату в RoomView. */
  acquire(ctx: RoomFeatureContext): void {
    this.release();
    const feature = resolveRoomFeature(ctx);
    this.feature.set(feature ?? null);
    const teardown = feature?.onEnter?.();
    if (typeof teardown === 'function') this.teardown.set(teardown);
    else this.teardown.set(null);
  }

  /** Освободить фичу. Вызывается при выходе из комнаты. */
  release(): void {
    const t = this.teardown();
    if (typeof t === 'function') t();
    this.teardown.set(null);
    this.feature.set(null);
  }
}
