import { Component, inject, signal, HostListener } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.scss'
})
export class UserMenu {
  private auth = inject(AuthService);

  isOpen = signal(false);
  user = this.auth.currentUser;

  get avatarLetter(): string {
    return this.user()?.username?.[0]?.toUpperCase() ?? '?';
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
}