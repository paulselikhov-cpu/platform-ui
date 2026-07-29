import { Component, inject, output, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../../services/theme.service';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { WindowModal } from '../window-modal/window-modal';

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
  standalone: true,
  imports: [WindowModal],
})
export class SettingsModal {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);

  readonly closeModal = output<void>();
  readonly currentPage = signal<'menu' | 'theme' | 'language'>('menu');

  themes: { id: Theme; label: string; desc: string }[] = [
    { id: 'dark', label: '🌙 Тёмная', desc: 'Холодная тёмная тема (по умолчанию)' },
    { id: 'light', label: '☀️ Светлая', desc: 'Холодная светлая тема' },
    { id: 'retro', label: '🖥️ Ретро', desc: 'Windows 2000 / постсоветский стиль' },
    { id: 'cold-retro', label: '❄️ Cold Retro', desc: 'Холодно-коричневый, мох / тауп' },
    { id: 'amber-retro', label: '🟠 Amber Retro', desc: 'Янтарный терминал / Fallout-стиль' },
  ];

  languages = [
    { id: 'ru', label: '🇷🇺 Русский' },
    { id: 'en', label: '🇬🇧 English' },
  ];

  selectTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }

  logout(): void {
    this.auth.logout();
  }

  goBack(): void {
    this.currentPage.set('menu');
  }
}