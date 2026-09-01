import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';

export interface CreateChatUserRequest {
  characterName: string;
  districtId: number;
  gender?: string;
  weight?: number;
  height?: number;
  badHabits?: string;
  avatarUrl?: string;
}

@Injectable({ providedIn: 'root' })
export class ChatUserService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/chat/users')

  /**
   * Получить персонажа пользователя в конкретном районе.
   * GET /api/chat/users/{userId}/characters?districtId={districtId}
   * Возвращает null если персонаж не создан
   */
  getChatUserByUserIdAndDistrict(userId: number, districtId: number): Observable<IChatUser | null> {
    return this.http.get<IChatUser>(`${this.baseUrl()}/${userId}/characters`, {
      params: { districtId: districtId.toString() }
    }).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Получить всех персонажей пользователя.
   * GET /api/chat/users/{userId}/characters/all
   */
  getAllChatUsersByUserId(userId: number): Observable<IChatUser[]> {
    return this.http.get<IChatUser[]>(`${this.baseUrl()}/${userId}/characters/all`).pipe(
      catchError(() => of([]))
    );
  }

  /**
   * Получить персонажа по userId (первый найденный) — для обратной совместимости
   */
  getChatUserByUserId(userId: number): Observable<IChatUser | null> {
    return this.http.get<IChatUser>(`${this.baseUrl()}/by-user/${userId}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Получить персонажа по его id (PK самого ChatUser)
   */
  getChatUserById(id: number): Observable<IChatUser | null> {
    return this.http.get<IChatUser>(`${this.baseUrl()}/${id}`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Создать персонажа для пользователя в указанном районе
   * POST /api/chat/users/{userId}/characters
   */
  createChatUser(userId: number, request: CreateChatUserRequest): Observable<IChatUser> {
    return this.http.post<IChatUser>(`${this.baseUrl()}/${userId}/characters`, request);
  }

  getChatUserLevel(userId: number) {
    return this.http.get<number>(`${this.baseUrl()}/${userId}/level`).pipe(
      catchError(() => of(null))
    );
  }
}