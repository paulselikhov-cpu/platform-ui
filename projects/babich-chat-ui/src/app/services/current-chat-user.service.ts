import { Injectable, inject, signal, effect } from '@angular/core';
import { AuthService } from './backend-services/base/auth.service';
import { ChatUserService } from './backend-services/http/chat-user.service';
import { IChatUser } from '../models/chatUser/chatUser.interface';

/**
 * Управляет состоянием текущего авторизованного ChatUser.
 * Автоматически загружает полный профиль после логина.
 */
@Injectable({ providedIn: 'root' })
export class CurrentChatUserService {
  private authService = inject(AuthService);
  private chatUserService = inject(ChatUserService);

  currentChatUser = signal<IChatUser | null>(null);

  constructor() {
    // Автозагрузка при изменении авторизации
    effect(() => {
      const authUser = this.authService.currentUser();
      if (authUser?.userId) {
        this.loadChatUser(authUser.userId);
      } else {
        this.currentChatUser.set(null);
      }
    });
  }

  private loadChatUser(userId: number): void {
    this.chatUserService.getChatUserById(userId).subscribe({
      next: (chatUser) => {
        if (chatUser) {
          this.currentChatUser.set(chatUser);
        }
      },
      error: (err) => console.error('Failed to load ChatUser:', err)
    });
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
   * Перезагружает профиль с сервера.
   */
  refresh(): void {
    const userId = this.authService.currentUser()?.userId;
    if (userId) {
      this.loadChatUser(userId);
    }
  }
}
