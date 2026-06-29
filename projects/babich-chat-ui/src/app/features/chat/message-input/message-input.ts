import { Component, input, signal, inject, output } from '@angular/core';

@Component({
  selector: 'app-message-input',
  templateUrl: './message-input.html',
  styleUrl: './message-input.scss'
})
export class MessageInput {
  roomName = input<string>('');

  // эмитим текст наружу — ChatArea решает, что с ним делать
  send = output<string>();

  message = signal('');

  submit(): void {
    const text = this.message().trim();
    console.log('Text message!!!!', text)
    if (!text) return;
    this.send.emit(text);
    this.message.set('');
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submit();
    }
  }
}