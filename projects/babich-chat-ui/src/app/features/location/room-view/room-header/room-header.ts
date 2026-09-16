import { Component, inject, input } from '@angular/core';
import { IRoom } from '../../../../models/location/location.interface';
import { ChatWebSocketService } from '../../../../services/backend-services/webSocket/chat-websocket.service';
import { ActionsMenu } from '../../../../shared/components/actions-menu/actions-menu';
import { RoomFeature } from '../../../room-feature/room-feature.interface';

/**
 * Шапка комнаты — живёт в room-view (не в chat-area).
 * Показывает имя комнаты, статус печатания, меню «⚡ Действия» из фичи
 * комнаты и статус подключения. Меню присутствия локации
 * (app-location-users-menu) шапка не создаёт: оно приходит контентом из
 * room-view через ng-content.
 * Специфика комнат — только через RoomFeature, без switch по roomCode.
 */
@Component({
  selector: 'app-room-header',
  imports: [ActionsMenu],
  templateUrl: './room-header.html',
  styleUrl: './room-header.scss',
})
export class RoomHeader {
  readonly room = input.required<IRoom>();
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
