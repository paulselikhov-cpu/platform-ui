import { Component, inject, input } from '@angular/core';
import { ILocation, IRoom } from '../../../../../models/location/location.interface';
import { ChatWebSocketService } from '../../../../../services/backend-services/webSocket/chat-websocket.service';
import { LocationUsersMenu } from '../../../../location/location-view/location-users-menu/location-users-menu';
import { LocationPresenceState } from '../../../../location/location-view/services/online-tracking.service';
import { ActionsMenu } from '../../../../../shared/components/actions-menu/actions-menu';
import { RoomFeature } from '../../room-feature/room-feature.interface';

/**
 * Шапка чата: имя комнаты, статус печатания, меню «⚡ Действия» (из фичи
 * комнаты), список пользователей и статус подключения.
 * Специфика комнат — только через RoomFeature, без switch по roomCode.
 */
@Component({
  selector: 'app-chat-area-header',
  imports: [LocationUsersMenu, ActionsMenu],
  templateUrl: './chat-area-header.html',
  styleUrl: './chat-area-header.scss',
})
export class ChatAreaHeader {
  readonly location = input.required<ILocation>();
  readonly room = input.required<IRoom>();
  readonly rooms = input.required<IRoom[]>();
  readonly onlineState = input.required<LocationPresenceState | null>();
  /** Фича комнаты — даёт пункты меню «⚡ Действия» (или null, если её нет). */
  readonly feature = input<RoomFeature | null>(null);


  private readonly chatWebSocketService = inject(ChatWebSocketService);

  readonly typingUsers = this.chatWebSocketService.typingUsers;
  readonly connected = this.chatWebSocketService.connected;

  getFirstTypingUser(): string {
    return Array.from(this.typingUsers().values())[0] ?? '';
  }

  pluralizePeople(count: number): string {
    const mod10 = count % 10;
    const mod100 = count % 100;
    if (mod100 >= 11 && mod100 <= 14) return 'человек';
    if (mod10 === 1) return 'человек';
    if (mod10 >= 2 && mod10 <= 4) return 'человека';
    return 'человек';
  }
}

