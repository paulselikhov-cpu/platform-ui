import { Injector, signal, Signal, Type } from '@angular/core';
import { ILocation, IRoom } from '../../models/location/location.interface';
import { RoomMenuItem } from '../../shared/components/actions-menu/room-menu-item.interface';

/** Режим отображения комнаты, который фича добавляет к чату. */
export interface RoomFeatureView {
  /** Уникальный в рамках фичи id (служебный 'chat' в списке не входит). */
  readonly id: string;
  /** Подпись на кнопке-режиме внизу room-view. */
  readonly label: string;
  /** Иконка на кнопке (эмодзи). */
  readonly icon?: string;
  /** Standalone-компонент — содержимое режима. Получает input `feature`. */
  readonly component: Type<unknown>;
  /** Показывать ли кнопку режима (по умолчанию — да). */
  readonly visible?: () => boolean;
}

/**
 * Контекст, который ядро room-view даёт фиче при создании.
 * injector — DI-контекст room-view (фича резолвит сервисы через него).
 */
export interface RoomFeatureContext {
  readonly room: IRoom;
  readonly location: ILocation;
  readonly injector: Injector;
}

/**
 * Фича специальной комнаты: пункты меню «⚡ Действия» в шапке чата +
 * режимы отображения (view-кнопки внизу room-view). Активный режим
 * хранится в самой фиче, поэтому переживает переключения.
 * Создаётся фабрикой resolveRoomFeature() — один экземпляр на комнату.
 */
export interface RoomFeature {
  /** Дополнительные режимы отображения (без служебного 'chat'). */
  readonly views: RoomFeatureView[];
  /** Активный режим ('chat' — по умолчанию у всех комнат). */
  readonly activeViewId: Signal<string>;
  /** Переключить режим отображения. */
  setActiveView(viewId: string): void;
  /** Пункты меню «⚡ Действия» в шапке (пусто — меню не показывается). */
  readonly menuItems: RoomMenuItem[];
  /** Header: пользователь выбрал пункт меню. */
  onMenuSelected?(itemId: string): void;
  /** Активация фичи (вход в комнату); может вернуть функцию очистки. */
  onRoomEnter?(): void | (() => void);
}

/** База для реализаций фич комнат. */
export abstract class BaseRoomFeature implements RoomFeature {
  readonly views: RoomFeatureView[] = [];
  readonly activeViewId = signal<string>('chat');
  readonly menuItems: RoomMenuItem[] = [];
  protected ctx!: RoomFeatureContext;

  /** Вызывается фабрикой сразу после конструктора, до передачи наружу. */
  init(ctx: RoomFeatureContext): this {
    this.ctx = ctx;
    return this;
  }

  setActiveView(viewId: string): void {
    this.activeViewId.set(viewId);
  }

  onMenuSelected(_itemId: string): void {}
  onRoomEnter(): void | (() => void) {}
}


