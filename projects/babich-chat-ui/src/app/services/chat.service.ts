import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import { AuthService } from '../core/services/auth.service';
import { IChatActionMessageParams, IChatMessageParams, IChatMessageResponse } from '../models/chat/message.interface';

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {
  private auth = inject(AuthService);

  // — состояние соединения
  readonly connected = signal(false);

  // — все сообщения текущей комнаты
  readonly messages = signal<IChatMessageResponse[]>([]);

  // — онлайн-пользователи (JOIN/LEAVE события)
  readonly onlineEvents = signal<IChatMessageResponse[]>([]); // - не реализовано на бэке

  // ─── typing indicator ─────────────────────────────────────────────────────
  // кто сейчас печатает в текущей комнате (имена пользователей)
  readonly typingUsers = signal<Set<string>>(new Set());

  readonly deletedMessageIds = signal<Set<number>>(new Set());

  private typingSub: StompSubscription | null = null;
  // таймеры для автоочистки — если человек перестал печатать
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

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

  // ─── отправить сообщение c сохранением истории ──────────────────────────────────────────────────
  sendMessageWithSaveHistory(content: string, roomId: string): void {
    if (!this.client?.connected || !content.trim()) return;
    const params: IChatMessageParams = {
      roomId, 
      content: content.trim(),
    }
    this.client.publish({
      destination: '/app/chat.history.send',
      body: JSON.stringify(params),
    });
  }

  // ─── переключить комнату без разрыва соединения ───────────────────────────
  switchRoom(newRoomId: string): void {
    if (this.currentRoomId === newRoomId) return;
    if (this.currentRoomId) this.notifyLeave(this.currentRoomId);

    this.messagesSub?.unsubscribe();
    this.usersSub?.unsubscribe();
    this.typingSub?.unsubscribe();

    // очищаем таймеры
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    this.messages.set([]);
    this.onlineEvents.set([]); // - не реализовано на бэке
    this.typingUsers.set(new Set());
    this.currentRoomId = newRoomId;

    this.subscribeToRoom(newRoomId);
    this.notifyJoin(newRoomId);
  }

  // ─── отключиться ─────────────────────────────────────────────────────────
  disconnect(): void {
    if (this.currentRoomId) this.notifyLeave(this.currentRoomId);
    this.client?.deactivate();
    this.messages.set([]);
    this.onlineEvents.set([]); //- не реализовано на бэке
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
        const msg: IChatMessageResponse = JSON.parse(frame.body);
        console.log('сообщение:', msg)

        if (msg.actionType === 'DELETE' && msg.id) {
          const id: number = msg.id;
          this.deletedMessageIds.update(set => new Set([...set, id]));
          console.log('delete!', this.deletedMessageIds());
          return;
        }

        if (msg.actionType === 'JOIN' || msg.actionType === 'LEAVE') {
          this.onlineEvents.update(prev => [...prev, msg]);
          return;
        }
        this.messages.update((prev) => [...prev, msg]);
        // фильтр по roomId больше не нужен — сервер уже изолировал
      }
    );

    // события входа / выхода пользователей - не реализовано на бэке
    this.usersSub = this.client.subscribe(
      '/topic/users',
      (frame: IMessage) => {
        const event: IChatMessageResponse = JSON.parse(frame.body);
        this.onlineEvents.update((prev) => [...prev, event]);
      }
    );

    // подписка на typing - уведомление о том что пользователь печатает сообщение
    this.subscribeToTyping(roomId);
  }

  private notifyJoin(roomId: string): void {
    if (!this.client?.connected) return; // ← guard
    const params: IChatActionMessageParams = {
      roomId, 
      actionType: 'JOIN'
    }
    this.client.publish({
      destination: '/app/chat.join',
      body: JSON.stringify(params),
    });
  }

  private notifyLeave(roomId: string): void {
    if (!this.client?.connected) return; // ← guard
    const params: IChatActionMessageParams = {
      roomId, 
      actionType: 'LEAVE'
    }
    this.client.publish({
      destination: '/app/chat.leave',
      body: JSON.stringify(params),
    });
  }

  private subscribeToTyping(roomId: string): void {
    if (!this.client) return;

    this.typingSub = this.client.subscribe(
      `/topic/typing.${roomId}`,
      (frame: IMessage) => {
        const msg = JSON.parse(frame.body);
        const sender = msg.sender;

        // не показываем свой собственный индикатор
        const currentUser = this.auth.currentUser();
        if (sender === currentUser?.username) return;

        // добавляем пользователя в список печатающих
        this.typingUsers.update(set => new Set([...set, sender]));

        // через 3 секунды без новых событий — убираем
        if (this.typingTimers.has(sender)) {
          clearTimeout(this.typingTimers.get(sender));
        }
        const timer = setTimeout(() => {
          this.typingUsers.update(set => {
            const next = new Set(set);
            next.delete(sender);
            return next;
          });
          this.typingTimers.delete(sender);
        }, 3000);

        this.typingTimers.set(sender, timer);
      }
    );
  }

  // отправить событие "печатаю"
  sendTyping(roomId: string): void {
    if (!this.client?.connected) return;
    const params: IChatActionMessageParams = {
      roomId, 
      actionType: 'TYPING'
    }
    this.client.publish({
      destination: '/app/chat.typing',
      body: JSON.stringify(params)
    });
  }
}