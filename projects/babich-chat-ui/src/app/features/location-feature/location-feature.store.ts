import { Injectable, Injector } from '@angular/core';
import { ILocation, IRoom } from '../../models/location/location.interface';
import { LocationFeature } from './location-feature.interface';
import { resolveLocationFeature } from './location-feature.factory';

/**
 * Хранилище фичи открытой локации — переживает пересоздание `ChatDesktop`.
 *
 * Зачем: `…/main`, `…/feature/:id` и `…/room/:id` — три отдельных routeConfig,
 * поэтому каждый переход (в т.ч. между комнатами) пересоздаёт компонент. Если бы
 * фича создавалась в конструкторе `ChatDesktop`, её состояние (например
 * `employeeAuthorized` в `CityHallFeature`) обнулялось бы на каждом шаге.
 *
 * Здесь живёт ровно одна фича — на текущую локацию. Смена локации (или уход
 * из локации) освобождает старую вместе с её lifecycle (teardown).
 */
@Injectable({ providedIn: 'root' })
export class LocationFeatureStore {
  private lastLocationRoute: string | null = null;

  private entry: {
    key: string;
    location: ILocation;
    room: IRoom | null;
    feature: LocationFeature;
    teardown: (() => void) | null;
  } | null = null;

  get currentLocation(): ILocation | null {
    return this.entry?.location ?? null;
  }

  get currentRoom(): IRoom | null {
    return this.entry?.room ?? null;
  }

  get rememberedLocationRoute(): string | null {
    return this.lastLocationRoute;
  }

  rememberLocationRoute(route: string): void {
    this.lastLocationRoute = route;
  }

  clearRememberedLocationRoute(): void {
    this.lastLocationRoute = null;
  }

  setCurrentRoom(locationId: number, room: IRoom | null): void {
    if (this.entry?.location.id === locationId) {
      this.entry.room = room;
    }
  }

  /**
   * Фича локации — из кэша, если это та же локация и тот же персонаж
   * (состояние сохраняется), иначе создаётся заново с запуском `onEnter()`.
   */
  acquire(location: ILocation, characterId: number, injector: Injector): LocationFeature {
    const key = `${location.id}:${characterId}`;
    if (this.entry?.key === key) {
      this.entry.location = location;
      return this.entry.feature;
    }

    this.release();

    const feature = resolveLocationFeature({ location, injector });
    const teardown = feature.onEnter?.();
    this.entry = {
      key,
      location,
      room: null,
      feature,
      teardown: typeof teardown === 'function' ? teardown : null,
    };
    return feature;
  }

  /** Освободить фичу: вызвать teardown (например, остановить поллинг выборов). */
  release(): void {
    this.entry?.teardown?.();
    this.entry = null;
  }

  /** Есть ли сейчас живая фича. */
  get hasFeature(): boolean {
    return this.entry !== null;
  }
}