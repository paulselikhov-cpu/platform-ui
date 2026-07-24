import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';

@Injectable({ providedIn: 'root' })
export class ChatUserService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/chat/users')

  /**
  *
  */
   getChatUserById(userId: number): Observable<IChatUser | null> {
    return this.http.get<IChatUser>(`${this.baseUrl()}/${userId}`).pipe(
      catchError(() => of(null))
    );
  }
}