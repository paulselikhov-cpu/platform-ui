import { Component, computed, effect, inject, Injector, input, OnDestroy } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { NgComponentOutlet } from '@angular/common';
import { switchMap } from 'rxjs/operators';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { resolveRoomFeature } from '../../room-feature/room-feature.factory';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { LocationUsersMenu } from './location-users-menu/location-users-menu';
import { OnlineTrackingService } from './services/online-tracking.service';
import { RoomHeader } from './room-header/room-header';

/**
 * Вью комнаты выбранной локации. Ядро режимов отображения:
 * - по умолчанию активен режим 'chat' (сам чат);
 * - фича комнаты может добавить свои режимы (views) — внизу появляются
 *   кнопки переключения; если режимов нет, кнопки вообще не показываются;
 * - активный режим хранится в фиче (переживает переключения).
 */
@Component({
  selector: 'app-room-view',
  imports: [ChatArea, NgComponentOutlet, RoomHeader, LocationUsersMenu],
  templateUrl: './room-view.html',
  styleUrl: './room-view.scss',
  standalone: true,
})
export class RoomView implements OnDestroy {
  readonly location = input.required<ILocation>();
  readonly selectedRoom = input<IRoom | null>(null);

  private onlineTrackingService = inject(OnlineTrackingService);
  private readonly injector = inject(Injector);

  /** Cleanup активной фичи (например, поллинг выборов). */
  private featureTeardown: (() => void) | null = null;

  constructor() {
    // Lifecycle фичи живёт здесь, а не в chat-area: room-view не размонтируется
    // при переключении режимов, поэтому поллинг фичи не прерывается, когда
    // пользователь смотрит не чат, а свой режим (например, «Выборы»).
    effect(() => {
      const feature = this.roomFeature();
      this.stopFeature();
      if (feature?.onRoomEnter) {
        const teardown = feature.onRoomEnter();
        if (typeof teardown === 'function') this.featureTeardown = teardown;
      }
    });

    // Активный режим пропал (например, сотрудник вышел из профиля и кнопка
    // «Личный кабинет» скрылась) — возвращаемся на «Чат», иначе остались бы
    // без подсвеченной кнопки и без контента.
    effect(() => {
      const feature = this.roomFeature();
      const viewId = this.activeViewId();
      if (!feature || viewId === 'chat') return;
      const stillVisible = this.featureViews().some((v) => v.id === viewId);
      if (!stillVisible) feature.setActiveView('chat');
    });
  }

  ngOnDestroy(): void {
    this.stopFeature();
  }

  private stopFeature(): void {
    this.featureTeardown?.();
    this.featureTeardown = null;
  }

  private readonly locationId = computed(() => this.location().id);

  readonly onlineState = toSignal(
    toObservable(this.locationId).pipe(
      switchMap(id => this.onlineTrackingService.getPresence$(id)),
    ),
    { initialValue: null },
  );

  readonly onlineIds = computed(() => this.onlineState()?.onlineIds ?? new Set<number>());

  readonly rooms = computed<IRoom[]>(() => {
    const template = this.location().template;
    if (!template?.templateRooms) return [];
    return template.templateRooms.map(r => ({
      id: r.id,
      code: r.code,
      name: r.name,
      description: r.description,
      storeHistory: false,
      isCustom: false,
      orderIndex: r.orderIndex,
    }));
  });

  // ── Режимы отображения ──

  /** Фича активной комнаты (создаётся здесь — состояние переживает переключения). */
  readonly roomFeature = computed(() => {
    const room = this.selectedRoom();
    const location = this.location();
    if (!room || !location) return null;
    return resolveRoomFeature({ room, location, injector: this.injector });
  });

  /** Видимые кнопки режимов фичи (без служебного 'chat'). */
  readonly featureViews = computed(() =>
    this.roomFeature()?.views.filter((v) => v.visible?.() ?? true) ?? [],
  );

  /** Показывать ли панель режимов: только если есть дополнительные режимы. */
  readonly showViewModes = computed(() => this.featureViews().length > 0);

  /** Активный режим ('chat' — дефолт у всех комнат). */
  readonly activeViewId = computed(() => this.roomFeature()?.activeViewId() ?? 'chat');

  /** Активный дополнительный режим (или null — показываем чат). */
  readonly activeView = computed(() =>
    this.featureViews().find((v) => v.id === this.activeViewId()) ?? null,
  );

  setView(viewId: string): void {
    this.roomFeature()?.setActiveView(viewId);
  }
}
