import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  userId: number;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

/**
 * Сервис авторизации — хранит состояние текущего пользователя.
 * Использует Angular Signals для реактивного состояния.
 *
 * Signal — это как BehaviorSubject но проще:
 * currentUser() — прочитать значение
 * currentUser.set(value) — установить значение
 * Компоненты автоматически обновляются при изменении signal.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  // текущий авторизованный пользователь
  // null = не авторизован
  currentUser = signal<AuthResponse | null>(this.loadUserFromStorage());

  // вычисляемый signal — авторизован ли пользователь
  isAuthenticated = signal<boolean>(!!this.loadUserFromStorage());

  /**
   * Загружает пользователя из localStorage при старте приложения.
   * Это восстанавливает сессию после перезагрузки страницы.
   */
  private loadUserFromStorage(): AuthResponse | null {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      return JSON.parse(user);
    }
    return null;
  }

  /**
   * Авторизация — отправляет логин/пароль, получает JWT токен.
   * tap() = выполнить побочный эффект не меняя поток данных.
   * После успешного логина сохраняем токен и пользователя.
   */
  login(request: LoginRequest) {
    return this.http.post<AuthResponse>('/api/auth/login', request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        this.currentUser.set(response);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * Регистрация — создаёт нового пользователя и сразу авторизует.
   */
  register(request: RegisterRequest) {
    return this.http.post<AuthResponse>('/api/auth/register', request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        this.currentUser.set(response);
        this.isAuthenticated.set(true);
      })
    );
  }

  /**
   * Выход — очищаем localStorage и сбрасываем состояние.
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }
}