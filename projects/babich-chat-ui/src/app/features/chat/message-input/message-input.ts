import { Component, input, signal } from '@angular/core';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss'
})
export class MessageInput {
  roomName = input<string>('');
  message = signal('');
}