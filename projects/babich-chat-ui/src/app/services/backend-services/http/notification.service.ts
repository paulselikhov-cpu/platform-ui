import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { INotification } from '../../../models/notification/notification.interface';
import { StompConnectionService } from '../base/stomp-connection.service';

/**
 * REST-доступ к уведомлениям текущего персонажа + live-подписка на WS-пуш
 * (/user/{username}/queue/notifications), которой шлёт бэкенд на события
 * выборов/заявок (NotificationEventListener).
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private stomp = inject(StompConnectionService);
  private baseUrl = '/api/notifications';

  /** Живой поток новых уведомлений текущего пользователя. */
  readonly live$ = this.stomp.topic<INotification>('/user/queue/notifications');

  /** Список уведомлений (свежие сверху). */
  list(): Observable<INotification[]> {
    return this.http.get<INotification[]>(this.baseUrl);
  }

  unreadCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/unread-count`);
  }

  markRead(id: number): Observable<INotification> {
    return this.http.post<INotification>(`${this.baseUrl}/${id}/read`, null);
  }

  accept(id: number): Observable<INotification> {
    return this.http.post<INotification>(`${this.baseUrl}/${id}/accept`, null);
  }

  decline(id: number): Observable<INotification> {
    return this.http.post<INotification>(`${this.baseUrl}/${id}/decline`, null);
  }
}
