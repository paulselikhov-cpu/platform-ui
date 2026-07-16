import { Component, input } from '@angular/core';
import { UnreadDividerState } from '../../../../services/frontend-services/messages/message-unread-tracker.service';

@Component({
  selector: 'app-unread-divider',
  imports: [],
  templateUrl: './unread-divider.html',
  styleUrl: './unread-divider.scss',
})
export class UnreadDivider {
  readonly state = input.required<UnreadDividerState>();
  readonly count = input.required<number>();
}