import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IChatMessage } from '../../models/chat/message.interface';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);

  getMessageHistory(roomId: number, page = 0, size = 50): Observable<IChatMessage[]> {
    return this.http.get<IChatMessage[]>(
      `/api/messages/room/${roomId}?page=${page}&size=${size}`
    );
  }

  deleteMessage(messageId: number): Observable<void> {
  return this.http.delete<void>(`/api/messages/${messageId}`);
  }

  deleteMessages(messageIds: number[]): Observable<void> {
    return this.http.delete<void>('/api/messages/batch', { body: messageIds });
  }
}