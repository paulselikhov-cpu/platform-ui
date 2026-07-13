import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './http-services/auth.service';
import { IChatActionMessageParams, IChatMessageParams, IChatMessageResponse } from '../models/messages/message.interface';

const HEARTBEAT_INTERVAL_MS = 10_000; // синхронизировано с бэковым HEARTBEAT_TIMEOUT_SECONDS = 45

@Injectable({ providedIn: 'root' })
export class ChatWebSocketService implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  // — состояние соединения
  readonly connected = signal(false);

  // — все сообщения текущей комнаты
  readonly messages = signal<IChatMessageResponse[]>([]);

  // ─── typing indicator ─────────────────────────────────────────────────────
  // кто сейчас печатает в текущей комнате (имена пользователей)
  readonly typingUsers = signal<Set<string>>(new Set());

  readonly deletedMessageIds = signal<Set<number>>(new Set());

  private typingSub: StompSubscription | null = null;
  // таймеры для автоочистки — если человек перестал печатать
  private typingTimers = new Map<string, ReturnType<typeof setTimeout>>();

  private client: Client | null = null;
  private messagesSub: StompSubscription | null = null;
  private currentRoomId: string | null = null;
  private currentLocationId: string | null = null;
  private authFailed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** Подключиться и сразу войти в комнату. locationId обязателен — нужен бэку для presence. */
  connect(locationId: string, roomId: string): void {
    if (this.client?.active) {
      this.switchRoom(locationId, roomId);
      return;
    }

    this.currentRoomId = roomId;
    this.currentLocationId = locationId;

    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${this.auth.getToken()}` },
      reconnectDelay: 5000,

      onConnect: () => {
        this.connected.set(true);
        this.subscribeToRoom(roomId);
        this.notifyJoin(locationId, roomId); // ← этот же вызов триггерит presence.enterRoom на бэке
        this.startHeartbeat();
      },

      onDisconnect: () => {
        this.connected.set(false);
        this.stopHeartbeat();
      },

      onUnhandledMessage: (msg: IMessage) => console.error('Unhandled message', msg),

      onStompError: (frame: IFrame) => {
        console.error('STOMP error', frame);
        const errorMsg = (frame.headers?.['message'] || frame.body || '').toString();
        if (errorMsg.includes('401') || errorMsg.includes('Unauthorized')) this.handleAuthError();
      },

      onWebSocketError: (event: Event | ErrorEvent) => {
        console.error('WebSocket error', event);
        if ((event as ErrorEvent).message?.includes('401') || !this.auth.getToken()) this.handleAuthError();
      },

      onWebSocketClose: () => {
        this.stopHeartbeat();
        if (this.authFailed && this.client) {
          this.client.deactivate();
          this.authFailed = false;
        }
      },
    });

    this.client.activate();
  }

  private handleAuthError(): void {
    this.authFailed = true;
    this.auth.clearSession();
    if (this.client) this.client.reconnectDelay = 0;
    this.router.navigate(['/login']);
  }

  sendMessageWithSaveHistory(content: string, roomId: string): void {
    if (!this.client?.connected || !content.trim()) return;
    const params: IChatMessageParams = { roomId, content: content.trim() };
    this.client.publish({ destination: '/app/chat.history.send', body: JSON.stringify(params) });
  }

  /** Переход между комнатами без разрыва WS-соединения. */
  switchRoom(locationId: string, newRoomId: string): void {
    if (this.currentRoomId === newRoomId && this.currentLocationId === locationId) return;

    this.messagesSub?.unsubscribe();
    this.typingSub?.unsubscribe();
    this.typingTimers.forEach(timer => clearTimeout(timer));
    this.typingTimers.clear();

    this.messages.set([]);
    this.typingUsers.set(new Set());
    this.currentRoomId = newRoomId;
    this.currentLocationId = locationId;

    this.subscribeToRoom(newRoomId);
    this.notifyJoin(locationId, newRoomId); // ← presence обновится на новую комнату
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.client?.deactivate();
    this.messages.set([]);
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }

  /**
   * Универсальная подписка на любой STOMP-топик — используется для presence,
   * бейджей непрочитанных и т.д. НЕ создаёт второй WebSocket, переиспользует
   * уже открытое соединение чата.
   *
   * Устойчива к вызову ДО того, как client успел подключиться (например,
   * LocationUsersMenu открылась раньше, чем ChatArea вызвала connect()) —
   * ретраит попытку подписки каждые 300мс, пока клиент не появится и не
   * подключится. Ошибку не кидает: пользователь просто увидит "офлайн"
   * до первого presence-события, что полностью корректно отражает реальность.
   */
  topic<T>(topic: string): Observable<T> {
    return new Observable<T>((subscriber) => {
      let sub: StompSubscription | null = null;
      let cancelled = false;

      const trySubscribe = () => {
        if (cancelled) return;
        if (this.client?.connected) {
          sub = this.client.subscribe(topic, (message: IMessage) => {
            subscriber.next(JSON.parse(message.body) as T);
          });
        } else {
          setTimeout(trySubscribe, 300);
        }
      };

      trySubscribe();

      return () => {
        cancelled = true;
        sub?.unsubscribe();
      };
    });
  }

  // ─── heartbeat: продлевает presence на бэке, пока соединение открыто ──────

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.client?.connected) return;
      this.client.publish({ destination: '/app/presence.heartbeat', body: '' });
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private subscribeToRoom(roomId: string): void {
    if (!this.client) return;

    this.messagesSub = this.client.subscribe(`/topic/room.${roomId}`, (frame: IMessage) => {
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
    if (!this.client?.connected) return;
    const params: IChatActionMessageParams = { roomId, locationId, actionType: 'JOIN' };
    this.client.publish({ destination: '/app/chat.join', body: JSON.stringify(params) });
  }

  private subscribeToTyping(roomId: string): void {
    if (!this.client) return;
    this.typingSub = this.client.subscribe(`/topic/typing.${roomId}`, (frame: IMessage) => {
      const msg = JSON.parse(frame.body);
      const sender = msg.sender;
      const currentUser = this.auth.currentUser();
      if (sender === currentUser?.username) return;

      this.typingUsers.update(set => new Set([...set, sender]));
      if (this.typingTimers.has(sender)) clearTimeout(this.typingTimers.get(sender));

      const timer = setTimeout(() => {
        this.typingUsers.update(set => {
          const next = new Set(set);
          next.delete(sender);
          return next;
        });
        this.typingTimers.delete(sender);
      }, 3000);
      this.typingTimers.set(sender, timer);
    });
  }

  sendTyping(roomId: string): void {
    if (!this.client?.connected) return;
    const params: IChatActionMessageParams = {
      roomId, locationId: this.currentLocationId ?? '', actionType: 'TYPING'
    };
    this.client.publish({ destination: '/app/chat.typing', body: JSON.stringify(params) });
  }
}