import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { ChatWebSocketService } from '../../../../services/backend-services/webSocket/chat-websocket.service';
import { MessageSelectionService } from './message-selection.service';
import { ChatRoomHistoryService } from './chat-room-history.service';
import { ContextMenuAction } from '../components/message-context-menu/message-context-menu';
import { IChatMessage, IChatMessageResponse, ISystemMessage } from '../../../../models/messages/message.interface';
import { isChatMessage, isSystemMessage } from '../../../../type-guards/chat-message.guard';
import { markMessagesDeleted } from '../utils/message-mutations.util';
import { MessageService } from '../../../../services/backend-services/http/message.service';

/**
 * Объединяет историю (БД) и реалтайм-ленту (WS) в единые списки для шаблона
 * и владеет всеми мутациями сообщений: reply, delete (единичный/групповой),
 * copy, а также реактивной обработкой DELETE-broadcast от других клиентов.
 * Свой инстанс на комнату (providers у ChatArea).
 */
@Injectable()
export class ChatMessagesService {
  private readonly messageService = inject(MessageService);
  private readonly selectionService = inject(MessageSelectionService);
  private readonly websocket = inject(ChatWebSocketService);
  private readonly historyService = inject(ChatRoomHistoryService);

  readonly replyTo = signal<IChatMessage | null>(null);

  readonly allMessages = computed<IChatMessageResponse[]>(() => [
    ...this.historyService.history(),
    ...this.websocket.messages(),
  ]);

  readonly chatHistory = computed<IChatMessage[]>(() =>
    this.historyService.history().filter(isChatMessage),
  );

  readonly chatMessages = computed<IChatMessage[]>(() =>
    this.websocket.messages().filter(isChatMessage),
  );

  readonly systemMessages = computed<ISystemMessage[]>(() =>
    this.websocket.messages().filter(isSystemMessage),
  );

  constructor() {
    // realtime DELETE-broadcast (кто-то другой удалил сообщение) —
    // помечаем и в истории, и в реалтайм-ленте одной и той же функцией
    effect(() => {
      const ids = this.websocket.deletedMessageIds();
      if (ids.size === 0) return;
      this.historyService.history.update(msgs => markMessagesDeleted(msgs, ids));
      this.websocket.messages.update(msgs => markMessagesDeleted(msgs, ids));
    });
  }

  onContextAction(action: ContextMenuAction): void {
    switch (action.type) {
      case 'reply':
        this.startReply(action.messageId);
        break;
      case 'delete':
        this.deleteSingle(action.messageId);
        break;
    }
  }

  startReply(messageId: number): void {
    const found = this.allMessages().filter(isChatMessage).find(m => m.id === messageId);
    if (found) this.replyTo.set(found);
  }

  cancelReply(): void {
    this.replyTo.set(null);
  }

  deleteSingle(messageId: number): void {
    this.messageService.deleteMessage(messageId).subscribe({
      next: () => this.applyDeletion([messageId]),
    });
  }

  deleteSelected(ids: number[]): void {
    this.messageService.deleteMessages(ids).subscribe({
      next: () => {
        this.applyDeletion(ids);
        this.selectionService.clearSelection();
      },
    });
  }

  copySelected(ids: number[]): void {
    const text = this.allMessages()
      .filter(isChatMessage)
      .filter(m => ids.includes(m.id) && !m.isDeleted)
      .map(m => `${m.character.characterName}: ${m.content}`)
      .join('\n');

    navigator.clipboard.writeText(text);
    this.selectionService.clearSelection();
  }

  private applyDeletion(ids: number[]): void {
    const idSet = new Set(ids);
    this.historyService.history.update(msgs => markMessagesDeleted(msgs, idSet));
    this.websocket.messages.update(msgs => markMessagesDeleted(msgs, idSet));
  }
}