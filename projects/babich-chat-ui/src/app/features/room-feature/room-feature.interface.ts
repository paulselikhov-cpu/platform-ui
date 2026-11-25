import { Injector, Type } from '@angular/core';
import { ILocation, IRoom } from '../../models/location/location.interface';

/**
 * Вкладка фичи комнаты — кнопка в нижнем таб-баре RoomView и компонент,
 * который открывается при выборе этой вкладки.
 */
export interface RoomFeatureTab {
  /** Уникальный в рамках фичи id. */
  readonly id: string;
  /** Подпись на кнопке вкладки. */
  readonly label: string;
  /** Иконка на кнопке (эмодзи). */
  readonly icon?: string;
  /** Standalone-компонент — содержимое вкладки. Получает input `feature`. */
  readonly component: Type<unknown>;
  /** Показывать ли вкладку (по умолчанию — да). */
  readonly visible?: () => boolean;
}

/**
 * Контекст, который ядро даёт фиче комнаты при создании.
 * injector — DI-контекст владельца (RoomView); фича резолвит сервисы через него.
 */
export interface RoomFeatureContext {
  readonly room: IRoom;
  readonly location: ILocation;
  readonly injector: Injector;
}

/**
 * Фича комнаты: вкладки (кнопки нижнего таб-бара RoomView).
 * Создаётся фабрикой resolveRoomFeature() — один экземпляр на комнату.
 */
export interface RoomFeature {
  /** Вкладки комнаты (кнопки таб-бара). */
  readonly tabs: RoomFeatureTab[];
  /** Активация фичи (вход в комнату); может вернуть функцию очистки. */
  onEnter?(): void | (() => void);
}

/** База для реализаций фич комнат. */
export abstract class BaseRoomFeature implements RoomFeature {
  readonly tabs: RoomFeatureTab[] = [];
  protected ctx!: RoomFeatureContext;

  /** Вызывается фабрикой сразу после конструктора, до передачи наружу. */
  init(ctx: RoomFeatureContext): this {
    this.ctx = ctx;
    return this;
  }

  onEnter(): void | (() => void) {}
}
