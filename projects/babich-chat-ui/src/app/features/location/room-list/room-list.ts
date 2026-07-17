import { Component, input, output, inject, effect } from '@angular/core';
import { IRoom } from '../../../models/location/location.interface';
import { UnreadTrackingSidebarService } from '../../../services/backend-services/chat/unread-tracking/unread-tracking-sidebar.service';
import { AuthService } from '../../../services/backend-services/base/auth.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss'
})
export class RoomList {
  rooms = input.required<IRoom[]>();
  selectedRoom = input<IRoom | null>(null);
  locationId = input.required<number>(); // ← нужен для загрузки разбивки

  roomSelected = output<IRoom>();

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