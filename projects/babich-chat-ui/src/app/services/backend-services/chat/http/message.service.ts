import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IRoomHistoryResponse } from '../../../../models/messages/message.interface';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/messages')

  getMessageHistory(roomId: number, characterId: number, page = 0, size = 50): Observable<IRoomHistoryResponse> {
    return this.http.get<IRoomHistoryResponse>(
      `${this.baseUrl()}/room/${roomId}?page=${page}&size=${size}&characterId=${characterId}`
    );
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl()}/${messageId}`);
  }

  deleteMessages(messageIds: number[]): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl()}/batch`, { body: messageIds });
  }
}