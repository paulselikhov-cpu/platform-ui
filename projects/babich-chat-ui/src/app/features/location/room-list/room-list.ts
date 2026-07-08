import { Component, input, output } from '@angular/core';
import { IRoom } from '../../../models/location/location.interface';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss'
})
export class RoomList {
  rooms = input.required<IRoom[]>();
  selectedRoom = input<IRoom | null>(null);
  
  roomSelected = output<IRoom>();
}