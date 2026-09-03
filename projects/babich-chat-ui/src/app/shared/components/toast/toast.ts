import { Component, inject } from '@angular/core';
import { MessageService } from '../../../services/message.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toast-container">
      @for (t of messageService.toasts(); track t.id) {
        <div class="toast" [class.toast--success]="t.kind === 'success'"
          [class.toast--error]="t.kind === 'error'" (click)="messageService.remove(t.id)">
          {{ t.text }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .toast-container {
        position: fixed;
        top: 12px;
        right: 12px;
        z-index: 2000;
        display: flex;
        flex-direction: column;
        gap: 8px;
        max-width: 320px;
      }
      .toast {
        padding: 10px 16px;
        border-radius: 6px;
        font-family: 'Courier New', monospace;
        font-size: 13px;
        color: #fff;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
        cursor: pointer;
        animation: toast-in 0.2s ease;
      }
      .toast--success {
        background: linear-gradient(180deg, #2f7d3a, #1f5a28);
        border: 1px solid #5fb566;
      }
      .toast--error {
        background: linear-gradient(180deg, #a9402e, #7e2c1f);
        border: 1px solid #e06a55;
      }
      @keyframes toast-in {
        from { opacity: 0; transform: translateX(20px); }
        to { opacity: 1; transform: translateX(0); }
      }
    `,
  ],
})
export class Toast {
  protected readonly messageService = inject(MessageService);
}
