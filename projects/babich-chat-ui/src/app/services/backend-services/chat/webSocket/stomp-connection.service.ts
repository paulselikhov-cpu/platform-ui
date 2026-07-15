import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { Client, IFrame, IMessage, StompSubscription } from '@stomp/stompjs';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/auth.service';

const HEARTBEAT_INTERVAL_MS = 10_000; // синхронизировано с бэковым HEARTBEAT_TIMEOUT_SECONDS = 45

/**
 * Низкоуровневый сервис одного STOMP/WebSocket-соединения на всё приложение.
 * Ничего не знает про комнаты чата, сообщения или typing — только жизненный
 * цикл соединения: создание клиента, heartbeat, реконнект, auth-ошибки,
 * generic-подписка на любой топик.
 *
 * Используется ChatWebSocketService, а также напрямую любыми другими
 * фичами, которым нужен WS (presence, бейджи непрочитанных и т.п.) —
 * им не нужно тянуть зависимость на чат ради этого.
 */
@Injectable({ providedIn: 'root' })
export class StompConnectionService implements OnDestroy {
  private auth = inject(AuthService);
  private router = inject(Router);

  readonly connected = signal(false);

  private client: Client | null = null;
  private authFailed = false;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  // колбэки, которые дергаются при каждом onConnect (в т.ч. при реконнекте)
  private connectListeners = new Set<() => void>();

  /** Подписаться на событие "соединение установлено/восстановлено".
   *  Возвращает функцию для отписки. */
  onConnect(listener: () => void): () => void {
    this.connectListeners.add(listener);
    return () => this.connectListeners.delete(listener);
  }

  /** Создаёт и активирует WS-соединение, если оно ещё не создано. Идемпотентно. */
  ensureClient(): void {
    if (this.client) return;

    this.client = new Client({
      brokerURL: `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws`,
      connectHeaders: { Authorization: `Bearer ${this.auth.getToken()}` },
      reconnectDelay: 5000,

      onConnect: () => {
        this.connected.set(true);
        this.startHeartbeat();
        this.connectListeners.forEach(listener => listener());
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

  /** Публикация в топик. Тихо игнорирует, если соединение ещё не готово. */
  publish(destination: string, body: string): void {
    if (!this.client?.connected) return;
    this.client.publish({ destination, body });
  }

  /** Низкоуровневая подписка с сырым коллбэком — для случаев, когда нужен
   *  контроль над парсингом/логикой (см. subscribeToRoom/subscribeToTyping в чате). */
  subscribeRaw(destination: string, callback: (message: IMessage) => void): StompSubscription | null {
    if (!this.client) return null;
    return this.client.subscribe(destination, callback);
  }

  /**
   * Универсальная подписка на любой STOMP-топик с JSON-парсингом.
   *
   * Устойчива к вызову ДО того, как client успел подключиться —
   * ретраит попытку подписки каждые 300мс, пока клиент не появится и не
   * подключится. Ошибку не кидает: подписчик просто не получит событий
   * до первого успешного connect, что корректно отражает реальность.
   */
  topic<T>(destination: string): Observable<T> {
    this.ensureClient();
    return new Observable<T>((subscriber) => {
      let sub: StompSubscription | null = null;
      let cancelled = false;

      const trySubscribe = () => {
        if (cancelled) return;
        if (this.client?.connected) {
          sub = this.client.subscribe(destination, (message: IMessage) => {
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

  private handleAuthError(): void {
    this.authFailed = true;
    this.auth.clearSession();
    if (this.client) this.client.reconnectDelay = 0;
    this.router.navigate(['/login']);
  }

  private startHeartbeat(): void {
    this.stopHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      this.publish('/app/presence.heartbeat', '');
    }, HEARTBEAT_INTERVAL_MS);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  disconnect(): void {
    this.stopHeartbeat();
    this.client?.deactivate();
    this.connected.set(false);
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}