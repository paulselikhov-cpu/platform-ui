import { Component, input } from '@angular/core';
import { Room } from '../../../services/location.service';
import { MessageInput } from '../message-input/message-input';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss'
})
export class ChatArea {
  room = input.required<Room>();
}