import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from '../../base/auth.service';
import { StompConnectionService } from '../../base/stomp-connection.service';
import { IChatActionMessageParams, IChatMessageParams, IChatMessageResponse } from '../../../../models/messages/message.interface';

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService implements OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly stomp = inject(StompConnectionService);

  readonly onlineUsersMap = signal(false);

  // — состояние соединения (проксируем сигнал из StompConnectionService как read-only)
  readonly connected = computed(() => this.stomp.connected());

  // — все сообщения текущей комнаты
  readonly messages = signal<IChatMessageResponse[]>([]);
  readonly deletedMessageIds = signal<Set<number>>(new Set());

  // ─── typing indicator ─────────────────────────────────────────────────────
  readonly typingUsers = signal<Map<number, string>>(new Map());
  private typingSub: StompSubscription | null = null;
  private readonly typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private topicRoomSub: StompSubscription | null = null;
  private currentRoomId: string | null = null;
  private currentLocationId: string | null = null;

  constructor() {
    // при каждом (пере)подключении — довходим в текущую комнату, если она известна
    this.stomp.onConnect(() => {
      if (this.currentRoomId && this.currentLocationId) {
        this.subscribeToRoom(this.currentRoomId);
        this.notifyJoin(this.currentLocationId, this.currentRoomId);
      }
    });
  }

  /** Подключиться и сразу войти в комнату. locationId обязателен — нужен бэку для presence. */
  connect(locationId: string, roomId: string): void {
    // уже в этой же комнате — просто убеждаемся, что соединение живо, ничего больше не делаем
    if (this.currentRoomId === roomId && this.currentLocationId === locationId) {
      this.stomp.ensureClient();
      return;
    }

    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();
    this.typingUsers.set(new Map());
    this.messages.set([]);
    

    this.currentRoomId = roomId;
    this.currentLocationId = locationId;
    this.stomp.ensureClient();

    if (this.connected()) {
      this.subscribeToRoom(roomId);
      this.notifyJoin(locationId, roomId);
    }
  }

  sendMessageWithSaveHistory(content: string, roomId: string): void {
    if (!content.trim()) return;
    const params: IChatMessageParams = { roomId, content: content.trim() };
    this.stomp.publish('/app/chat.history.send', JSON.stringify(params));
  }

  disconnect(): void {
    this.stomp.disconnect();
    this.messages.set([]);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  private subscribeToRoom(roomId: string): void {
    this.topicRoomSub?.unsubscribe(); // страховка: не плодим подписки, даже если вызвали повторно
    this.typingSub?.unsubscribe();

    this.topicRoomSub = this.stomp.subscribeRaw(`/topic/room.${roomId}`, (frame: IMessage) => {
      const msg: IChatMessageResponse = JSON.parse(frame.body);

      if (msg.actionType === 'DELETE') {
        this.deletedMessageIds.update(set => new Set([...set, msg.id]));
        return;
      }
      if (msg.actionType === 'JOIN') {
        this.messages.update(prev => [...prev, msg]);
        return;
      }
      if (msg.actionType === 'CHAT') {
        this.messages.update(prev => [...prev, msg]);
      }
    });

    this.subscribeToTyping(roomId);
  }

  /** Один вызов на бэк одновременно шлёт системное сообщение JOIN и триггерит presence.enterRoom. */
  private notifyJoin(locationId: string, roomId: string): void {
    const params: IChatActionMessageParams = { roomId, locationId, actionType: 'JOIN' };
    this.stomp.publish('/app/chat.join', JSON.stringify(params));
  }

  private subscribeToTyping(roomId: string): void {
    this.typingSub = this.stomp.subscribeRaw(`/topic/typing.${roomId}`, (frame: IMessage) => {
      const msg = JSON.parse(frame.body);
      const senderId = msg.character?.userId;
      const senderName = msg.character?.characterName ?? 'Кто-то';
      const currentUserId = this.auth.currentUser()?.userId;

      if (senderId != null && senderId === currentUserId) return;

      this.typingUsers.update(map => new Map(map).set(senderId, senderName));
      if (this.typingTimers.has(senderId)) clearTimeout(this.typingTimers.get(senderId));

      const timer = setTimeout(() => {
      this.typingUsers.update(map => {
        const next = new Map(map);
        next.delete(senderId);
        return next;
      });
      this.typingTimers.delete(senderId);
    }, 3000);
    this.typingTimers.set(senderId, timer);
    });
  }

  sendTyping(roomId: string): void {
    const params: IChatActionMessageParams = {
      roomId, locationId: this.currentLocationId ?? '', actionType: 'TYPING'
    };
    this.stomp.publish('/app/chat.typing', JSON.stringify(params));
  }

  leaveRoom(locationId: string, roomId: string): void {
    const params: IChatActionMessageParams = { roomId, locationId, actionType: 'JOIN' };
    this.stomp.publish('/app/chat.leave', JSON.stringify(params));

    this.topicRoomSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.topicRoomSub = null;
    this.typingSub = null;
    this.currentRoomId = null;
    this.currentLocationId = null;
  }

  notifyRead(locationId: string, roomId: string): void {
    const params: IChatActionMessageParams = { roomId, locationId, actionType: 'JOIN' };
    this.stomp.publish('/app/chat.read', JSON.stringify(params));
  }
}