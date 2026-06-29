import { Component, input, inject, OnChanges, signal } from '@angular/core';
import { Location, LocationService, Room } from '../../../services/location.service';
import { RoomList } from '../room-list/room-list';
import { ChatArea } from '../../chat/chat-area/chat-area';

@Component({
  selector: 'app-location-view',
  imports: [RoomList, ChatArea],
  templateUrl: './location-view.html',
  styleUrl: './location-view.scss'
})
export class LocationView implements OnChanges {
  private locationService = inject(LocationService);

  location = input.required<Location>();
  rooms = signal<Room[]>([]);
  selectedRoom = signal<Room | null>(null);
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
        if (rooms.length > 0) this.selectedRoom.set(rooms[0]);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  onRoomSelected(room: Room) {
    this.selectedRoom.set(room);
  }
}