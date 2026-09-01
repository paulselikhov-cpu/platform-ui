import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'dark' | 'light' | 'retro' | 'cold-retro' | 'amber-retro';

const STORAGE_KEY = 'babich-chat-theme';

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
      if (stored === 'dark' || stored === 'light' || stored === 'retro' || stored === 'cold-retro' || stored === 'amber-retro') {
        return stored;
      }
    } catch {}
    return 'dark'; // по умолчанию
  }

  private saveTheme(theme: Theme): void {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
  }
}