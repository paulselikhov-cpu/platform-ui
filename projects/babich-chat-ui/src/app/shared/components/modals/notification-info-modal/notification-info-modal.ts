import { Component, output } from '@angular/core';
import { WindowModal } from '../window-modal/window-modal';

@Component({
  selector: 'app-notification-info-modal',
  templateUrl: './notification-info-modal.html',
  styleUrl: './notification-info-modal.scss',
  standalone: true,
  imports: [WindowModal],
})
export class NotificationInfoModal {
  readonly closeModal = output<void>();
}