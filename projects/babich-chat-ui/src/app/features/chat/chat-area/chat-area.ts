import {
  Component, input, inject, effect,
  viewChild, ElementRef, signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { IRoom } from '../../../models/location/location.interface';
import { LocationService } from '../../../services/location.service';
import { ChatService } from '../../../services/chat.service';
import { MessageContextMenu, ContextMenuAction } from './message-context-menu/message-context-menu';
import { SelectionToolbar } from './selection-toolbar/selection-toolbar';
import { MessageContextMenuService } from '../../../services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../services/message-selection.service';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { MessageArea } from './message-area/message-area';
import { IChatMessage, IHistoryMessage } from '../../../models/chat/message.interface';
import { MessageService } from '../../../services/message/message.service';

@Component({
  selector: 'app-chat-area',
  imports: [MessageInput, DatePipe, MessageContextMenu, SelectionToolbar, MessageArea],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea {
  room = input.required<IRoom>();
  private chat = inject(ChatService);
  private messageService = inject(MessageService);
  private ctxMenuService = inject(MessageContextMenuService);
  readonly selectionService = inject(MessageSelectionService);

  private messagesEl = viewChild<ElementRef<HTMLDivElement>>('messagesContainer');

  readonly typingUsers = this.chat.typingUsers;
  readonly String = String;
  readonly ctxMenuState = this.ctxMenuService.state;

  // история из БД (загружается один раз при открытии комнаты)
  history = signal<IHistoryMessage[]>([]);
  historyLoading = signal(false);

  // реалтайм сообщения из WebSocket
  readonly messages = this.chat.messages;
  readonly connected = this.chat.connected;

  // reply state
  replyTo = signal<IHistoryMessage | null>(null);

  constructor() {
    // при смене комнаты — подключаемся к WS и загружаем историю
    effect(() => {
      const room = this.room();
      if (room) {
        this.chat.connect(String(room.id));
        this.loadHistory(room.id);
        this.selectionService.clearSelection(); // сбрасываем при смене комнаты
      }
    });

    // автоскролл при новом WS сообщении
    effect(() => {
      this.messages();
      this.scrollToBottom();
    });
  }

  onContextAction(action: ContextMenuAction) {
    switch (action.type) {
      case 'reply':
        const msg = this.history().find(m => m.id === action.messageId);
        if (msg) this.replyTo.set(msg);
        break;
      case 'delete':
        this.deleteSingleMessage(action.messageId);
        break;
    }
  }

  // ─── удаление ────────────────────────────────────────────────────────────

  deleteSingleMessage(messageId: number) {
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => {
        this.history.update(msgs =>
          msgs.map(m => m.id === messageId
            ? { ...m, isDeleted: true, content: 'Сообщение удалено' }
            : m
          )
        );
      }
    });
  }

  onDeleteSelected(ids: number[]) {
    this.messageService.deleteMessages(ids).subscribe({
      next: () => {
        this.history.update(msgs =>
          msgs.map(m => ids.includes(m.id)
            ? { ...m, isDeleted: true, content: 'Сообщение удалено' }
            : m
          )
        );
        this.selectionService.clearSelection();
      }
    });
  }

  onCopySelected(ids: number[]) {
    const texts = this.history()
      .filter(m => ids.includes(m.id) && !m.isDeleted)
      .map(m => `${this.getSenderName(m)}: ${m.content}`)
      .join('\n');
    navigator.clipboard.writeText(texts);
    this.selectionService.clearSelection();
  }

  cancelReply() {
    this.replyTo.set(null);
  }

  // ─── остальные методы ────────────────────────────────────────────────────

  loadHistory(roomId: number) {
    this.historyLoading.set(true);
    this.history.set([]);
    this.messageService.getMessageHistory(roomId).subscribe({
      next: (messages) => {
        this.history.set(messages);
        this.historyLoading.set(false);
        this.scrollToBottom();
      },
      error: () => this.historyLoading.set(false)
    });
  }

  sendMessage(text: string): void {
    this.chat.sendMessage(text, String(this.room().id));
    this.replyTo.set(null);
  }

  sendFile(file: File): void {
    console.log('Файл:', file.name);
  }

  sendVoice(blob: Blob): void {
    console.log('Голосовое:', blob.size);
  }

  isSystem(msg: IChatMessage): boolean {
    return msg.type === 'JOIN' || msg.type === 'LEAVE';
  }

  getSenderName(msg: IHistoryMessage): string {
    return msg.character?.characterName ?? 'Неизвестный';
  }

  getAvatarLetter(msg: IHistoryMessage): string {
    return (msg.character?.characterName ?? '?')[0].toUpperCase();
  }

  getFirstTypingUser(): string {
    return Array.from(this.typingUsers())[0] ?? '';
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