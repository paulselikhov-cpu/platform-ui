import { Component, input, inject, OnChanges, signal } from '@angular/core';
import { RoomList } from '../room-list/room-list';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { LocationUsersMenu } from './location-users-menu/location-users-menu';
import { LocationService } from '../../../services/backend-services/chat/http/location.service';

@Component({
  selector: 'app-location-view',
  imports: [RoomList, ChatArea, LocationUsersMenu],
  templateUrl: './location-view.html',
  styleUrl: './location-view.scss'
})
export class LocationView implements OnChanges {
  private locationService = inject(LocationService);

  location = input.required<ILocation>();

  rooms = signal<IRoom[]>([]);
  selectedRoom = signal<IRoom | null>(null);
  loading = signal(true);

  ngOnChanges() {
    this.selectedRoom.set(null);
    this.loading.set(true);
    this.loadRooms();
  }

  loadRooms() {
    this.locationService.getRooms(this.location().id).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        if (rooms.length > 0) {
          // Всегда заходим именно в дефолтную комнату ("прихожую"), а не в
          // первую по порядку — гарантирует, что presence всегда открывается
          // в предсказуемом месте, независимо от порядка комнат в ответе API.
          const defaultRoom = rooms[0] // rooms.find(r => r.isDefault) ??;
          this.selectedRoom.set(defaultRoom);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onRoomSelected(room: IRoom) {
    this.selectedRoom.set(room);
  }
}