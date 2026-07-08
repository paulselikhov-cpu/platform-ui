import { Component, input, output } from '@angular/core';

export interface ConfirmModalConfig {
  icon?: string;
  title: string;
  message: string;        // поддерживает HTML — используй [innerHTML] если нужно
  confirmText?: string;
  cancelText?: string;
  confirmDanger?: boolean; // красная кнопка подтверждения (default: true)
}

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.html',
  styleUrl: './confirm-modal.scss'
})
export class ConfirmModal {
  protected config = input.required<ConfirmModalConfig>();
  protected loading = input<boolean>(false);

  protected confirmed = output<void>();
  protected cancelled = output<void>();

  get confirmDanger(): boolean {
    return this.config().confirmDanger ?? true;
  }

  get confirmText(): string {
    return this.config().confirmText ?? 'Подтвердить';
  }

  get cancelText(): string {
    return this.config().cancelText ?? 'Отмена';
  }
}