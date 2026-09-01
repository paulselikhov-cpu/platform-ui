import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/backend-services/base/auth.service';

/**
 * Главное меню — приветственная заставка после регистрации/логина.
 * Показывает информацию о платформе и предлагает:
 * 1. Войти (создать персонажа / продолжить) — переход к выбору района
 * 2. Выйти — возврат на экран логина
 */
@Component({
  selector: 'app-main-menu',
  imports: [],
  templateUrl: './main-menu.html',
  styleUrl: './main-menu.scss'
})
export class MainMenu {
  private router = inject(Router);
  private auth = inject(AuthService);

  onEnter() {
    this.router.navigate(['/district-select']);
  }

  onLogout() {
    this.auth.logout();
  }
}