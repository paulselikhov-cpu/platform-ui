import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IChatMessageResponse, IRoomHistoryResponse } from '../../models/messages/message.interface';

@Injectable({ providedIn: 'root' })
export class MessageService {
  private http = inject(HttpClient);

  // getMessageHistory(roomId: number, characterId: number): Observable<IRoomHistoryResponse> {
  //   return this.http.get<IRoomHistoryResponse>(`/api/rooms/${roomId}/history`, {
  //     params: { characterId: characterId.toString() }
  //   });
  // }

  getMessageHistory(roomId: number, characterId: number, page = 0, size = 50): Observable<IRoomHistoryResponse> {
    return this.http.get<IRoomHistoryResponse>(
      `/api/messages/room/${roomId}?page=${page}&size=${size}&characterId=${characterId}`
    );
  }

  deleteMessage(messageId: number): Observable<void> {
    return this.http.delete<void>(`/api/messages/${messageId}`);
  }

  deleteMessages(messageIds: number[]): Observable<void> {
    return this.http.delete<void>('/api/messages/batch', { body: messageIds });
  }
}