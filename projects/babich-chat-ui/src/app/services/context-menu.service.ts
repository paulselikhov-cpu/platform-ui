import { Injectable, signal } from '@angular/core';

/**
 * Глобальный сервис для управления контекстным меню.
 * Гарантирует что только одно меню открыто в любой момент.
 */
@Injectable({ providedIn: 'root' })
export class ContextMenuService {
  // id локации у которой открыто меню
  openMenuId = signal<number | null>(null);

  open(locationId: number) {
    this.openMenuId.set(locationId);
  }

  close() {
    this.openMenuId.set(null);
  }

  isOpen(locationId: number): boolean {
    return this.openMenuId() === locationId;
  }
}