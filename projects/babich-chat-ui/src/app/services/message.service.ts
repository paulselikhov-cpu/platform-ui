import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  kind: 'success' | 'error';
  text: string;
}

/**
 * Глобальные всплывающие уведомления (зелёные/красные в правом верхнем углу).
 * Показ через <app-toast /> в корневом шаблоне.
 */
@Injectable({ providedIn: 'root' })
export class MessageService {
  readonly toasts = signal<ToastMessage[]>([]);
  private seq = 0;
  private readonly lifetimeMs = 3200;

  success(text: string): void {
    this.show('success', text);
  }

  error(text: string): void {
    this.show('error', text);
  }

  private show(kind: ToastMessage['kind'], text: string): void {
    const id = ++this.seq;
    this.toasts.update((list) => [...list, { id, kind, text }]);
    setTimeout(() => this.remove(id), this.lifetimeMs);
  }

  remove(id: number): void {
    this.toasts.update((list) => list.filter((t) => t.id !== id));
  }
}
