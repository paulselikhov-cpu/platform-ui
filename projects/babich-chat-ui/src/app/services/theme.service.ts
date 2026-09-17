import { Injectable, signal, effect } from '@angular/core';

/**
 * 4 темы оформления:
 *  - retro-dark   — Тёмная (олдскул): тёмно-синие оттенки, Win XP/2000
 *  - retro-light  — Светлая (олдскул): нейтральные тёмно-бежевые тона
 *  - modern-dark  — Тёмная (современная): современный мессенджер
 *  - modern-light — Светлая (современная): современный мессенджер
 */
export type Theme = 'retro-dark' | 'retro-light' | 'modern-dark' | 'modern-light';

const STORAGE_KEY = 'babich-chat-theme';

const VALID_THEMES: readonly Theme[] = ['retro-dark', 'retro-light', 'modern-dark', 'modern-light'];

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.loadTheme());

  constructor() {
    // Применяем тему при создании сервиса
    this.applyTheme(this.theme());

    // Следим за изменениями
    effect(() => {
      const t = this.theme();
      this.applyTheme(t);
      this.saveTheme(t);
    });
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
  }

  private applyTheme(theme: Theme): void {
    document.documentElement.setAttribute('data-theme', theme);
  }

  private loadTheme(): Theme {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_THEMES.includes(stored as Theme)) {
        return stored as Theme;
      }
    } catch {}
    return 'retro-dark'; // по умолчанию — тёмная (олдскул)
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }
}