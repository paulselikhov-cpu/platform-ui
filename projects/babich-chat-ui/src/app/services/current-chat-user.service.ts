import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from './backend-services/base/auth.service';
import { ChatUserService, CreateChatUserRequest } from './backend-services/http/chat-user.service';
import { IChatUser } from '../models/chatUser/chatUser.interface';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

const STORAGE_KEY_DISTRICT = 'babich_current_district_id';

/**
 * Управляет состоянием текущего авторизованного ChatUser в рамках района.
 * Автоматически загружает полный профиль после логина по userId + districtId.
 */
@Injectable({ providedIn: 'root' })
export class CurrentChatUserService {
  private authService = inject(AuthService);
  private chatUserService = inject(ChatUserService);

  currentChatUser = signal<IChatUser | null>(null);
  hasCharacter = signal<boolean>(false);
  selectedDistrictId = signal<number | null>(this.loadDistrictId());
  userLevel = signal<number>(0);

  constructor() {
    // Автозагрузка при изменении авторизации или выбранного района
    effect(() => {
      const authUser = this.authService.currentUser();
      const districtId = this.selectedDistrictId();
      if (authUser?.userId && districtId) {
        this.loadChatUser(authUser.userId, districtId);
      } else {
        this.currentChatUser.set(null);
        this.hasCharacter.set(false);
      }
    });
  }

  /**
   * Установить выбранный район (например, при выборе на экране DistrictSelect).
   * Сохраняет в localStorage для сохранения между сессиями.
   */
  setDistrictId(districtId: number): void {
    this.selectedDistrictId.set(districtId);
    localStorage.setItem(STORAGE_KEY_DISTRICT, districtId.toString());
  }

  private loadDistrictId(): number | null {
    const stored = localStorage.getItem(STORAGE_KEY_DISTRICT);
    return stored ? Number(stored) : null;
  }

  private loadUserLevel(userId: number): void {
    this.chatUserService.getChatUserLevel(userId).subscribe((level) => {
      this.userLevel.set(level ?? 0);
    });
  }

  private loadChatUser(userId: number, districtId: number): void {
    this.chatUserService.getChatUserByUserIdAndDistrict(userId, districtId).subscribe({
      next: (chatUser) => {
        if (chatUser) {
          this.currentChatUser.set(chatUser);
          this.loadUserLevel(chatUser.id);
          this.hasCharacter.set(true);
        } else {
          this.currentChatUser.set(null);
          this.hasCharacter.set(false);
        }
      },
      error: () => {
        this.currentChatUser.set(null);
        this.hasCharacter.set(false);
      }
    });
  }

  /**
   * Создать персонажа в выбранном районе и установить как текущего
   */
  createAndSetChatUser(userId: number, request: CreateChatUserRequest): Observable<IChatUser> {
    return this.chatUserService.createChatUser(userId, request).pipe(
      tap((chatUser) => {
        this.currentChatUser.set(chatUser);
        this.hasCharacter.set(true);
      })
    );
  }

  /**
   * Обновляет текущего пользователя (например, после работы или траты монет).
   */
  updateChatUser(updates: Partial<IChatUser>): void {
    const current = this.currentChatUser();
    if (current) {
      this.currentChatUser.set({ ...current, ...updates });
    }
  }

  /**
   * Перезагружает профиль с сервера (для текущего userId + districtId).
   */
  refresh(): void {
    const userId = this.authService.currentUser()?.userId;
    const districtId = this.selectedDistrictId();
    if (userId && districtId) {
      this.loadChatUser(userId, districtId);
    }
  }
}