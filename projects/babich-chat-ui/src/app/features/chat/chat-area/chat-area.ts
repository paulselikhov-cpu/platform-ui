import {
  Component,
  input,
  inject,
  effect,
  viewChild,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Room } from '../../../services/location.service';
import { ChatService, ChatMessage } from '../../../services/chat.service';
import { MessageInput } from '../message-input/message-input';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, DatePipe],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  room = input.required<Room>();

  private chat = inject(ChatService);

  // ссылка на контейнер сообщений для автоскролла
  private messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  // прокидываем сигналы из сервиса прямо в шаблон
  readonly messages = this.chat.messages;
  readonly connected = this.chat.connected;
  readonly onlineEvents = this.chat.onlineEvents;

  constructor() {
    // при смене комнаты — переключаемся в WebSocket
    effect(() => {
      const r = this.room();
      if (r) {
        this.chat.connect(String(r.id));
      }
    });

    // автоскролл вниз при новом сообщении
    effect(() => {
      this.messages(); // отслеживаем изменения
      this.scrollToBottom();
    });
  }

  sendMessage(text: string): void {
    this.chat.sendMessage(text, String(this.room().id));
  }

  isSystem(msg: ChatMessage): boolean {
    return msg.type === 'JOIN' || msg.type === 'LEAVE';
  }

  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      // откладываем на следующий тик, чтобы DOM успел отрисоваться
      setTimeout(() => (el.scrollTop = el.scrollHeight), 0);
    }
  }
}