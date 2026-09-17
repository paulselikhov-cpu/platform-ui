import { Component, inject, signal, HostListener } from '@angular/core';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { ThemeService, Theme } from '../../../services/theme.service';

const THEME_ORDER: readonly Theme[] = ['retro-dark', 'retro-light', 'modern-dark', 'modern-light'];

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss'
})
export class UserMenu {
  private auth = inject(AuthService);
  readonly themeService = inject(ThemeService);

  protected isOpen = signal(false);
  protected user = this.auth.currentUser;

  get avatarLetter(): string {
    return this.user()?.username?.[0]?.toUpperCase() ?? '?';
  }

  // Отображение текущей темы в пункте меню
  protected get currentThemeLabel(): string {
    switch (this.themeService.theme()) {
      case 'retro-dark': return '🌙 Тёмная (олдскул)';
      case 'retro-light': return '☀️ Светлая (олдскул)';
      case 'modern-dark': return '🌑 Тёмная (современная)';
      case 'modern-light': return '💡 Светлая (современная)';
    }
  }

  toggle(): void {
    this.isOpen.update(v => !v);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: MouseEvent): void {
    if (!(e.target as HTMLElement).closest('app-user-menu')) {
      this.isOpen.set(false);
    }
  }

  logout(): void {
    this.isOpen.set(false);
    this.auth.logout();
  }

  // Циклический переключатель по 4 темам (быстрый доступ, полный выбор — в настройках)
  cycleTheme(): void {
    const current = this.themeService.theme();
    const next = THEME_ORDER[(THEME_ORDER.indexOf(current) + 1) % THEME_ORDER.length];
    this.themeService.setTheme(next);
  }
}