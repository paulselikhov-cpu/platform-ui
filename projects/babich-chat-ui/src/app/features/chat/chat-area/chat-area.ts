import { Component, input, inject, viewChild, OnDestroy } from '@angular/core';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { MessageInput } from '../../../shared/components/message-input/message-input';
import { IChatMessage } from '../../../models/messages/message.interface';
import { isChatMessage } from '../../../type-guards/chat-message.guard';
import { ChatWebSocketService } from '../../../services/backend-services/webSocket/chat-websocket.service';
import { MessageSelectionService } from './services/message-selection.service';
import { MessageUnreadTrackerService } from './services/message-unread-tracker.service';
import { ChatRoomHistoryService } from './services/chat-room-history.service';
import { ChatMessagesService } from './services/chat-messages.service';
import { SelectionToolbar } from './components/selection-toolbar/selection-toolbar';
import { ChatAreaMessages } from './components/chat-area-messages/chat-area-messages';

/**
 * Ядро чата комнаты: лента сообщений + панель ввода/выделения.
 * Шапка комнаты (app-room-header) и меню присутствия локации живут в
 * room-view — chat-area про них ничего не знает и не рендерит их.
 */
@Component({
  selector: 'app-chat-area',
  imports: [
    MessageInput, SelectionToolbar,
    ChatAreaMessages,
  ],
  // свой инстанс каждого сервиса на комнату (на каждый ChatArea)
  providers: [MessageUnreadTrackerService, ChatRoomHistoryService, ChatMessagesService],
  templateUrl: './chat-area.html',
  styleUrl: './chat-area.scss',
})
export class ChatArea implements OnDestroy {
  readonly room = input.required<IRoom>();
  readonly location = input.required<ILocation>();
  readonly onlineIds = input.required<Set<number>>();

  private readonly chatWebSocketService = inject(ChatWebSocketService);

  readonly selectionService = inject(MessageSelectionService);
  readonly messagesService = inject(ChatMessagesService);

  readonly messagesComp = viewChild.required(ChatAreaMessages);

  onDeleteSelected(ids: number[]): void {
    this.messagesService.deleteSelected(ids);
  }

  onCopySelected(ids: number[]): void {
    this.messagesService.copySelected(ids);
  }

  cancelReply(): void {
    this.messagesService.cancelReply();
  }

  sendMessage(text: string): void {
    const replyToId = this.messagesService.replyTo()?.id;
    this.chatWebSocketService.sendMessageWithSaveHistory(text, String(this.room().id), replyToId);
    this.messagesService.cancelReply();
    this.messagesComp().scrollToBottom(true);
  }

  sendFile(file: File): void {
    console.log('Файл:', file.name);
  }

  sendVoice(blob: Blob): void {
    console.log('Голосовое:', blob.size);
  }

  getAllMessages(): IChatMessage[] {
    return this.messagesService.allMessages().filter(isChatMessage);
  }

  ngOnDestroy(): void {
    const room = this.room();
    const location = this.location();
    if (room && location) {
      this.chatWebSocketService.leaveRoom(String(location.id), String(room.id));
    }
  }
}

