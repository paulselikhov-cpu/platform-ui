import { Component, inject, signal, HostListener } from '@angular/core';
import { AuthService } from '../../../services/backend-services/base/auth.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss'
})
export class UserMenu {
  private auth = inject(AuthService);

  protected isOpen = signal(false);
  protected user = this.auth.currentUser;

  get avatarLetter(): string {
    return this.user()?.username?.[0]?.toUpperCase() ?? '?';
  }

  theme = signal<'dark' | 'light'>(
    (localStorage.getItem('theme') as 'dark' | 'light') ?? 'dark'
  );


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

  toggleTheme(): void {
    const next = this.theme() === 'dark' ? 'light' : 'dark';
    this.theme.set(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next === 'light' ? 'light' : '');
  }
}