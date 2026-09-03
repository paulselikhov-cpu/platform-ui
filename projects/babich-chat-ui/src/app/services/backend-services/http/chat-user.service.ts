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

  /**
   * Порог XP следующего уровня (для прогресс-бара XP).
   * GET /api/chat/users/{id}/xp-threshold
   */
  getXpThreshold(characterId: number) {
    return this.http.get<number>(`${this.baseUrl()}/${characterId}/xp-threshold`).pipe(
      catchError(() => of(null))
    );
  }

  /**
   * Список персонажей района — админская таблица. Только ADMIN.
   * GET /api/chat/users/district/{districtId}
   */
  getDistrictCharacters(districtId: number): Observable<IChatUser[]> {
    return this.http.get<IChatUser[]>(`${this.baseUrl()}/district/${districtId}`);
  }

  /**
   * Сменить роль персонажа. Только ADMIN; свою роль менять нельзя.
   * PUT /api/chat/users/{characterId}/role
   */
  updateRole(characterId: number, role: string): Observable<IChatUser> {
    return this.http.put<IChatUser>(`${this.baseUrl()}/${characterId}/role`, { role });
  }

  /**
   * Обновить поля персонажа (роль, профессия, статус, монеты, энергия, рейтинг).
   * Только ADMIN. null — не менять поле.
   * PUT /api/chat/users/{characterId}/settings
   */
  updateCharacterSettings(
    characterId: number,
    body: Partial<Pick<IChatUser, 'role' | 'profession' | 'gameStatus' | 'coinBalance' | 'energy' | 'rating' | 'xpUser'>>,
  ): Observable<IChatUser> {
    return this.http.put<IChatUser>(`${this.baseUrl()}/${characterId}/settings`, body);
  }
}