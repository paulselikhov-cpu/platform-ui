import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-window-modal',
  templateUrl: './window-modal.html',
  styleUrl: './window-modal.scss',
  standalone: true,
})
export class WindowModal {
  readonly title = input.required<string>();
  readonly closeModal = output<void>();

  close(): void {
    this.closeModal.emit();
  }
}