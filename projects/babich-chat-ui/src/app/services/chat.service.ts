import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from './auth.service'; // путь под твой проект

export interface ChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  content: string;
  sender: string;
  roomId: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private auth = inject(AuthService);

  // — состояние соединения
  readonly connected = signal(false);

  // — все сообщения текущей комнаты
  readonly messages = signal<ChatMessage[]>([]);

  // — онлайн-пользователи (JOIN/LEAVE события)
  readonly onlineEvents = signal<ChatMessage[]>([]);

  private client: Client | null = null;
  private messagesSub: StompSubscription | null = null;
  private usersSub: StompSubscription | null = null;
  private currentRoomId: string | null = null;

  // ─── подключиться и войти в комнату ───────────────────────────────────────
  connect(roomId: string): void {
    if (this.client?.active) {
      // уже подключены — просто переключаем комнату
      this.switchRoom(roomId);
      return;
    }

    this.currentRoomId = roomId;

    this.client = new Client({
      // SockJS даёт fallback для браузеров без нативного WS
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,

      // JWT из AuthService в заголовке STOMP CONNECT
      connectHeaders: {
        Authorization: `Bearer ${this.auth.getToken()}`,
      },

      // тихий reconnect каждые 5 секунд при обрыве
      reconnectDelay: 5000,

      onConnect: () => {
        this.connected.set(true);
        this.subscribeToRoom(roomId);
        this.notifyJoin(roomId);
      },

      onDisconnect: () => {
        this.connected.set(false);
      },

      onStompError: (frame) => {
        console.error('STOMP error', frame);
      },
    });

    this.client.activate();
  }

  // ─── отправить сообщение ──────────────────────────────────────────────────
  sendMessage(content: string, roomId: string): void {
  if (!this.client?.connected || !content.trim()) return; // connected вместо active
  
  this.client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ content: content.trim(), roomId, type: 'CHAT' }),
  });
}

  // ─── переключить комнату без разрыва соединения ───────────────────────────
  switchRoom(newRoomId: string): void {
    if (this.currentRoomId === newRoomId) return;

    // уведомляем всех об уходе из старой комнаты
    if (this.currentRoomId) this.notifyLeave(this.currentRoomId);

    // отписываемся от старых топиков
    this.messagesSub?.unsubscribe();
    this.usersSub?.unsubscribe();

    this.messages.set([]);
    this.onlineEvents.set([]);
    this.currentRoomId = newRoomId;

    this.subscribeToRoom(newRoomId);
    this.notifyJoin(newRoomId);
  }

  // ─── отключиться ─────────────────────────────────────────────────────────
  disconnect(): void {
    if (this.currentRoomId) this.notifyLeave(this.currentRoomId);
    this.client?.deactivate();
    this.messages.set([]);
    this.onlineEvents.set([]);
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  // ─── приватные хелперы ────────────────────────────────────────────────────

  private subscribeToRoom(roomId: string): void {
    if (!this.client) return;

    // входящие сообщения чата
    this.messagesSub = this.client.subscribe(
        `/topic/room.${roomId}`,   // ← конкретная комната
        (frame: IMessage) => {
        const msg: ChatMessage = JSON.parse(frame.body);
        this.messages.update((prev) => [...prev, msg]);
        // фильтр по roomId больше не нужен — сервер уже изолировал
        }
    );

    // события входа / выхода пользователей
    this.usersSub = this.client.subscribe(
      '/topic/users',
      (frame: IMessage) => {
        const event: ChatMessage = JSON.parse(frame.body);
        this.onlineEvents.update((prev) => [...prev, event]);
      }
    );
  }

  private notifyJoin(roomId: string): void {
    if (!this.client?.connected) return; // ← guard
    this.client.publish({
        destination: '/app/chat.join',
        body: JSON.stringify({ roomId, type: 'JOIN' }),
    });
    }

  private notifyLeave(roomId: string): void {
    if (!this.client?.connected) return; // ← guard
    this.client.publish({
        destination: '/app/chat.leave',
        body: JSON.stringify({ roomId, type: 'LEAVE' }),
    });
    }
}