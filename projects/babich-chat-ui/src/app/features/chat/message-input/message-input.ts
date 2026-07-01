import { Component, input, output, signal, inject } from '@angular/core';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss'
})
export class MessageInput {
  private chat = inject(ChatService);

  roomName = input<string>('');
  roomId = input<string>(''); 
  send = output<string>();

  message = signal('');

  // дроссель — отправляем typing не чаще раза в секунду
  private lastTypingSent = 0;

  onInput(value: string): void {
    this.message.set(value);

    // отправляем typing событие с дросселем 1 секунда
    const now = Date.now();
    if (now - this.lastTypingSent > 1000 && value.trim()) {
      this.chat.sendTyping(this.roomId());
      this.lastTypingSent = now;
    }
  }

  onSend(): void {
    const text = this.message().trim();
    if (!text) return;
    this.send.emit(text);
    this.message.set('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.onSend();
    }
  }
}