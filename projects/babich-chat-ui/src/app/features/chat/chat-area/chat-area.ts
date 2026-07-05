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
import { LocationService } from '../../../services/location.service';
import { ChatService } from '../../../services/chat.service';
import { MessageInput } from '../message-input/message-input';
import { IHistoryMessage, IRoom } from '../../../models/location/location.interface';
import { IChatMessage } from '../../../models/chat/chat.interface';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, DatePipe],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  room = input.required<IRoom>();

  private chat = inject(ChatService);
  private locationService = inject(LocationService);

  private messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly typingUsers = this.chat.typingUsers;
  readonly String = String;

  // история из БД (загружается один раз при открытии комнаты)
  history = signal<IHistoryMessage[]>([]);
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

  private scrollToBottom(): void {
    const el = this.messagesEl()?.nativeElement;
    if (el) {
      setTimeout(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
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

  isSystem(msg: IChatMessage): boolean {
    return msg.type === 'JOIN' || msg.type === 'LEAVE';
  }

  // имя отправителя для истории
  getSenderName(msg: IHistoryMessage): string {
    return msg.character?.characterName ?? 'Неизвестный';
  }

  // первая буква для аватара
  getAvatarLetter(msg: IHistoryMessage): string {
    return (msg.character?.characterName ?? '?')[0].toUpperCase();
  }

  getFirstTypingUser(): string {
    return Array.from(this.typingUsers())[0] ?? '';
  }

  sendFile(file: File): void {
    // пока логируем — потом подключим загрузку на сервер
    console.log('Файл для отправки:', file.name, file.size);
    // TODO: загрузить файл через HTTP, получить URL, отправить в чат
  }

  sendVoice(blob: Blob): void {
    console.log('Голосовое для отправки:', blob.size, blob.type);
    // TODO: загрузить аудио через HTTP, получить URL, отправить в чат
  }
}