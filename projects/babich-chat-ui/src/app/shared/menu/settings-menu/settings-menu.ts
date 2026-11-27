import { Component, inject, model } from '@angular/core';
import { Router } from '@angular/router';
import { ThemeService, Theme } from '../../../services/theme.service';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { BackButton } from '../../components/buttons/back-button/back-button';
import { DefaultButtonComponent } from '../../components/buttons/default-button/default-button';
import { DefaultCard } from '../../components/default-card/default-card';
import { DefaultList } from '../../components/default-list/default-list';

export type SettingsMenuPage = 'menu' | 'theme' | 'language';
export type SettingsSubpage = Exclude<SettingsMenuPage, 'menu'>;

export const SETTINGS_PAGE_TITLES: Record<SettingsSubpage, string> = {
  theme: 'Оформление',
  language: 'Язык',
};

@Component({
  selector: 'app-settings-menu',
  imports: [BackButton, DefaultButtonComponent, DefaultCard, DefaultList],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.scss',
  standalone: true,
})
export class SettingsMenu {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly themeService = inject(ThemeService);
  readonly pageTitles = SETTINGS_PAGE_TITLES;

  readonly currentPage = model<SettingsMenuPage>('menu');

  themes: { id: Theme; label: string; desc: string }[] = [
    { id: 'retro-dark', label: '🌙 Тёмная (олдскул)', desc: 'Тёмно-синие оттенки, Windows XP/2000' },
    { id: 'retro-light', label: '☀️ Светлая (олдскул)', desc: 'Нейтральные тёмно-бежевые тона' },
    { id: 'modern-dark', label: '🌑 Тёмная (современная)', desc: 'Современный мессенджер, тёмная' },
    { id: 'modern-light', label: '💡 Светлая (современная)', desc: 'Современный мессенджер, светлая' },
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