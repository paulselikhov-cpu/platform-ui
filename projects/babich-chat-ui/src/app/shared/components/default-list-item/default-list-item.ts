import { Component, input } from '@angular/core';

@Component({
  selector: 'app-default-list-item',
  standalone: true,
  templateUrl: './default-list-item.html',
  styleUrl: './default-list-item.scss',
  host: {
    '[class.is-unread]': 'unread()',
    '[class.is-interactive]': 'interactive()',
  },
})
export class DefaultListItem {
  readonly title = input.required<string>();
  readonly body = input.required<string>();
  readonly unread = input(false);
  readonly interactive = input(false);
  readonly accentTitle = input(false);
}
