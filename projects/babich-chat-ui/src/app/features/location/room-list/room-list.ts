import { Component, input, output, inject, effect } from '@angular/core';
import { IRoom } from '../../../models/location/location.interface';
import { UnreadTrackingSidebarService } from '../../sidebar/service/unread-tracking-sidebar.service';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { UnreadBadge } from '../../../shared/components/unread-badge/unread-badge';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss',
  standalone: true,
  imports: [UnreadBadge],
})
export class RoomList {
  rooms = input.required<IRoom[]>();
  selectedRoom = input<IRoom | null>(null);
  /** Активна ли кнопка «Главная» (роут `location/:id/main`, без комнаты и раздела). */
  activeHome = input(false);
  locationId = input.required<number>(); // ← нужен для загрузки разбивки

  roomSelected = output<IRoom>();
  /** Нажата кнопка «Главная» — возврат в главное меню локации. */
  homeSelected = output<void>();

  private readonly unreadTrackingSidebarService = inject(UnreadTrackingSidebarService);
  private readonly auth = inject(AuthService);

  constructor() {
    effect(() => {
      const locId = this.locationId();
      const characterId = this.auth.currentUser()?.userId;
      if (locId && characterId) {
        this.unreadTrackingSidebarService.loadRoomBreakdown(locId, characterId);
      }
    });
  }

  unreadFor(roomId: number) {
    return this.unreadTrackingSidebarService.roomCountFor(this.locationId(), roomId)();
  }
}