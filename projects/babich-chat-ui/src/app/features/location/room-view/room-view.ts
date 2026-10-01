import { Component, computed, inject, input } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs/operators';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { LocationUsersMenu } from './location-users-menu/location-users-menu';
import { OnlineTrackingService } from './services/online-tracking.service';
import { ChatWebSocketService } from '../../../services/backend-services/webSocket/chat-websocket.service';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { resolveRoomActions } from './room-actions.factory';

/**
 * Чат комнаты: шапка комнаты (имя, «печатает…», меню «⚡ Действия», статус
 * подключения) + лента сообщений. Специфики комнат здесь нет — фичи локаций
 * живут в главном меню локации (`location/:locationId/main`), а не в комнате.
 * Действия комнаты приходят из resolveRoomActions() (сейчас — заглушка).
 */
@Component({
  selector: 'app-room-view',
  imports: [ChatArea, LocationUsersMenu, LocationHeader],
  templateUrl: './room-view.html',
  styleUrl: './room-view.scss',
  standalone: true,
})
export class RoomView {
  readonly location = input.required<ILocation>();
  readonly selectedRoom = input.required<IRoom>();

  private readonly onlineTrackingService = inject(OnlineTrackingService);
  private readonly chatWebSocketService = inject(ChatWebSocketService);

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
