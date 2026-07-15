import { Component, input, inject, OnChanges, signal, computed } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { switchMap } from 'rxjs';
import { RoomList } from '../room-list/room-list';
import { ChatArea } from '../../chat/chat-area/chat-area';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { LocationUsersMenu } from './location-users-menu/location-users-menu';
import { LocationService } from '../../../services/backend-services/chat/http/location.service';
import { OnlineTrackingService } from '../../../services/backend-services/chat/online-tracking/online-tracking.service';

@Component({
  selector: 'app-location-view',
  imports: [RoomList, ChatArea, LocationUsersMenu],
  templateUrl: './location-view.html',
  styleUrl: './location-view.scss'
})
export class LocationView implements OnChanges {
  readonly location = input.required<ILocation>();

  private locationService = inject(LocationService);
  private onlineTrackingService = inject(OnlineTrackingService);

  readonly rooms = signal<IRoom[]>([]);
  readonly selectedRoom = signal<IRoom | null>(null);
  readonly loading = signal(true);

  private readonly locationId = computed(() => this.location().id);

  readonly onlineState = toSignal(
    toObservable(this.locationId).pipe(
      switchMap(id => this.onlineTrackingService.getPresence$(id)),
    ),
    { initialValue: null },
  );

  readonly onlineIds = computed(() => this.onlineState()?.onlineIds ?? new Set<number>());

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
          const defaultRoom = rooms[0];
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