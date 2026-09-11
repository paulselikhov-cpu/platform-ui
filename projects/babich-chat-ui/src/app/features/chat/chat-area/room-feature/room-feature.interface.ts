import { Injector } from '@angular/core';
import { ILocation, IRoom } from '../../../../models/location/location.interface';
import { RoomMenuItem } from '../../../../shared/components/actions-menu/room-menu-item.interface';

/** Что рендерит RoomFeaturePanel в контенте чата для этой комнаты. */
export type RoomFeatureContent = 'election' | 'governors-admin' | 'reception';

/**
 * Контекст, который ядро chat-area даёт фиче при создании.
 * injector — DI-контекст chat-area (фича резолвит сервисы через него).
 */
export interface RoomFeatureContext {
  readonly room: IRoom;
  readonly location: ILocation;
  readonly injector: Injector;
}

/**
 * Фича специальной комнаты: объединяет действия (меню в шапке),
 * контент-панель (contentKey) и общее состояние фичи.
 * Создаётся фабрикой resolveRoomFeature() — один экземпляр на активную комнату.
 */
export interface RoomFeature {
  readonly contentKey: RoomFeatureContent;
  /** Пункты меню «⚡ Действия» в шапке (пусто — меню не показывается). */
  readonly menuItems: RoomMenuItem[];
  /** Header: пользователь выбрал пункт меню. */
  onMenuSelected?(itemId: string): void;
  /** Активация фичи (вход в комнату); может вернуть функцию очистки. */
  onRoomEnter?(): void | (() => void);
}

/** База для реализаций фич комнат. */
export abstract class BaseRoomFeature implements RoomFeature {
  abstract readonly contentKey: RoomFeatureContent;
  readonly menuItems: RoomMenuItem[] = [];
  protected ctx!: RoomFeatureContext;

  /** Вызывается фабрикой сразу после конструктора, до передачи наружу. */
  init(ctx: RoomFeatureContext): this {
    this.ctx = ctx;
    return this;
  }

  onMenuSelected(_itemId: string): void {}
  onRoomEnter(): void | (() => void) {}
}
