import { Component, input, output } from '@angular/core';
import { Room } from '../../../services/location.service';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss'
})
export class RoomList {
  rooms = input.required<Room[]>();
  selectedRoom = input<Room | null>(null);
  roomSelected = output<Room>();
}