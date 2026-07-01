import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { IAuthResponse, ILoginRequest, IRegisterRequest } from '../models/auth/auth.interface';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);

  currentUser = signal<IAuthResponse | null>(this.loadUserFromStorage());
  isAuthenticated = signal<boolean>(!!this.loadUserFromStorage());

  private loadUserFromStorage(): IAuthResponse | null {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) return JSON.parse(user);
    return null;
  }

  login(request: ILoginRequest) {
    return this.http.post<IAuthResponse>('/api/auth/login', request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        this.currentUser.set(response);
        this.isAuthenticated.set(true);
      })
    );
  }

  register(request: IRegisterRequest) {
    return this.http.post<IAuthResponse>('/api/auth/register', request).pipe(
      tap(response => {
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response));
        this.currentUser.set(response);
        this.isAuthenticated.set(true);
      })
    );
  }

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