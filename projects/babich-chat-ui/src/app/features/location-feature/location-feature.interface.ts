import { Injector, Type } from '@angular/core';
import { ILocation } from '../../models/location/location.interface';
import { RoomMenuItem } from '../../shared/components/actions-menu/room-menu-item.interface';

/**
 * Раздел (экран) фичи локации — кнопка в главном меню локации
 * (`location/:locationId/main`) и компонент, который открывается по этой кнопке.
 */
export interface LocationFeatureScreen {
  /** Уникальный в рамках фичи id (используется в URL `.../feature/:screenId`). */
  readonly id: string;
  /** Подпись на кнопке-разделе. */
  readonly label: string;
  /** Иконка на кнопке (эмодзи). */
  readonly icon?: string;
  /** Standalone-компонент — содержимое раздела. Получает input `feature`. */
  readonly component: Type<unknown>;
  /** Показывать ли кнопку раздела (по умолчанию — да). */
  readonly visible?: () => boolean;
}

/**
 * Контекст, который ядро даёт фиче локации при создании.
 * injector — DI-контекст владельца (ChatDesktop); фича резолвит сервисы через него.
 */
export interface LocationFeatureContext {
  readonly location: ILocation;
  readonly injector: Injector;
}

/**
 * Фича локации: разделы (screens) — кнопки в главном меню локации, и
 * пункты меню «⚡ Действия» в шапке. Классификация по {@link LocationType}:
 * системные локации — своя фича на тип, бизнес/обычные — свои реализации.
 * Создаётся фабрикой resolveLocationFeature() — один экземпляр на локацию.
 */
export interface LocationFeature {
  /** Разделы локации (кнопки главного меню). */
  readonly screens: LocationFeatureScreen[];
  /** Пункты меню «⚡ Действия» в шапке (пусто — меню не показывается). */
  readonly menuItems: RoomMenuItem[];
  /** Пользователь выбрал пункт меню. */
  onMenuSelected?(itemId: string): void;
  /** Активация фичи (вход в локацию); может вернуть функцию очистки. */
  onEnter?(): void | (() => void);
}

/** База для реализаций фич локаций. */
export abstract class BaseLocationFeature implements LocationFeature {
  readonly screens: LocationFeatureScreen[] = [];
  readonly menuItems: RoomMenuItem[] = [];
  protected ctx!: LocationFeatureContext;

  /** Вызывается фабрикой сразу после конструктора, до передачи наружу. */
  init(ctx: LocationFeatureContext): this {
    this.ctx = ctx;
    return this;
  }

  onMenuSelected(_itemId: string): void {}
  onEnter(): void | (() => void) {}
}
