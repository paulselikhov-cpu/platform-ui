import { Component, computed, effect, inject, input, output, Injector, signal } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { LocationUsersMenu } from './location-users-menu/location-users-menu';
import { OnlineTrackingService } from './services/online-tracking.service';
import { ChatWebSocketService } from '../../../services/backend-services/webSocket/chat-websocket.service';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { resolveRoomActions } from './room-actions.factory';
import { RoomFeatureStore } from '../../room-feature/room-feature.store';
import { BacketPanelComponent } from '../../room-feature/general-market/shop-main/tabs/backet-panel/backet-panel.component';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';

/**
 * Чат комнаты: шапка комнаты (имя, «печатает…», меню «⚡ Действия», статус
 * подключения) + лента сообщений. Если у комнаты есть фича (например,
 * торговая зона магазина), внизу появляется таб-бар с вкладками фичи.
 * chat-area остаётся смонтированным при переключении вкладок.
 */
@Component({
  selector: 'app-room-view',
  imports: [ChatArea, LocationUsersMenu, LocationHeader, NgComponentOutlet],
  templateUrl: './room-view.html',
  styleUrl: './room-view.scss',
  standalone: true,
})
export class RoomView {
  readonly location = input.required<ILocation>();
  readonly selectedRoom = input.required<IRoom>();

  /**
   * Показывать кнопку «назад» в шапке. На дескстопе возвращаться к списку
   * комнат не нужно — он и так на экране; на мобиле комната открыта
   * во весь экран, поэтому возврат обязателен.
   */
  readonly showBack = input(false);
  /** Нажата кнопка «назад». */
  readonly back = output<void>();

  private readonly injector = inject(Injector);
  private readonly onlineTrackingService = inject(OnlineTrackingService);
  private readonly chatWebSocketService = inject(ChatWebSocketService);
  private readonly roomFeatureStore = inject(RoomFeatureStore);
  private readonly currentChatUserService = inject(CurrentChatUserService);

  /** ID текущего персонажа (из профиля пользователя в районе). */
  readonly characterId = computed(() => this.currentChatUserService.currentChatUser()?.id ?? 0);

  /** Активная вкладка: 'chat' или id вкладки фичи комнаты. */
  readonly activeTab = signal<'chat' | string>('chat');

  /** Вкладки фичи комнаты (без вкладки «Чат»). */
  readonly featureTabs = computed(() => {
    const feature = this.roomFeatureStore.activeFeature();
    return feature?.tabs?.filter((t) => (t.visible ? t.visible() : true)) ?? [];
  });

  /** Все вкладки для таб-бара. */
  readonly allTabs = computed(() => [
    { id: 'chat', label: 'Чат' },
    ...this.featureTabs().map((t) => ({ id: t.id, label: t.label })),
  ]);

  /** Показывать ли таб-бар (только если есть фича комнаты). */
  readonly showTabBar = computed(() => this.featureTabs().length > 0);

  /** Компонент активной вкладки фичи (или null для чата). */
  readonly activeTabComponent = computed(() => {
    if (this.activeTab() === 'chat') return null;
    const feature = this.roomFeatureStore.activeFeature();
    return feature?.tabs.find((t) => t.id === this.activeTab())?.component ?? null;
  });

  constructor() {
    effect(() => {
      const room = this.selectedRoom();
      const location = this.location();
      if (room && location) {
        this.roomFeatureStore.acquire({
          room,
          location,
          injector: this.injector,
        });
      }
    });
  }

  readonly connected = this.chatWebSocketService.connected;
  readonly typingUsers = this.chatWebSocketService.typingUsers;

  /** Текст «печатает…» для шапки (null — никто не печатает). */
  readonly typingText = computed<string | null>(() => {
    const users = this.typingUsers();
    if (users.size === 0) return null;
    if (users.size === 1) {
      return `${Array.from(users.values())[0] ?? ''} печатает...`;
    }
    return `${users.size} ${this.pluralizePeople(users.size)} печатают...`;
  });

  readonly statusText = computed(() => (this.connected() ? '● онлайн' : '○ подключение...'));

  /** Пункты меню «⚡ Действия» комнаты (сейчас — заглушка). */
  readonly menuItems = computed(() => resolveRoomActions(this.location(), this.selectedRoom()));

  pluralizePeople(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'человек';
    if (mod10 === 1) return 'человек';
    if (mod10 >= 2 && mod10 <= 4) return 'человека';
    return 'человек';
  }

  readonly locationId = computed(() => this.location().id);

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
}
