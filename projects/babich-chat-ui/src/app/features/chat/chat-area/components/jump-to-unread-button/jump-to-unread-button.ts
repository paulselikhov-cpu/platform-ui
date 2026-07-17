import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-jump-to-unread-button',
  imports: [],
  templateUrl: './jump-to-unread-button.html',
  styleUrl: './jump-to-unread-button.scss',
})
export class JumpToUnreadButton {
  readonly count = input.required<number>();
  readonly jump = output<void>();
}