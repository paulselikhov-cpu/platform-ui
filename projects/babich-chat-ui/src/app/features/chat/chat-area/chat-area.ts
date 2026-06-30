import {
  Component,
  input,
  inject,
  effect,
  viewChild,
  ElementRef,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Room } from '../../../services/location.service';
import { LocationService, HistoryMessage } from '../../../services/location.service';
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
  private locationService = inject(LocationService);

  private messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  // история из БД (загружается один раз при открытии комнаты)
  history = signal<HistoryMessage[]>([]);
  historyLoading = signal(false);

  // реалтайм сообщения из WebSocket
  readonly messages = this.chat.messages;
  readonly connected = this.chat.connected;

  constructor() {
    // при смене комнаты — подключаемся к WS и загружаем историю
    effect(() => {
      const r = this.room();
      if (r) {
        this.chat.connect(String(r.id));
        this.loadHistory(r.id);
      }
    });

    // автоскролл при новом WS сообщении
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });
  }

  loadHistory(roomId: number) {
    this.historyLoading.set(true);
    this.history.set([]);

    this.locationService.getMessageHistory(roomId).subscribe({
      next: (messages) => {
        this.history.set(messages);
        this.historyLoading.set(false);
        // скроллим вниз после загрузки истории
        this.scrollToBottom();
      },
      error: () => this.historyLoading.set(false)
    });
  }

  sendMessage(text: string): void {
    this.chat.sendMessage(text, String(this.room().id));
  }

  isSystem(msg: ChatMessage): boolean {
    return msg.type === 'JOIN' || msg.type === 'LEAVE';
  }

  // имя отправителя для истории
  getSenderName(msg: HistoryMessage): string {
    return msg.character?.characterName ?? 'Неизвестный';
  }

  // первая буква для аватара
  getAvatarLetter(msg: HistoryMessage): string {
    return (msg.character?.characterName ?? '?')[0].toUpperCase();
  }

  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }
}