import { Component, input } from '@angular/core';

@Component({
  selector: 'default-card',
  standalone: true,
  templateUrl: './default-card.html',
  styleUrl: './default-card.scss',
})
export class DefaultCard {
  readonly image = input('');
  readonly imageUrl = input<string | null>(null);
  readonly title = input('');
  readonly body = input('');
  readonly description = input('');
  readonly showButtons = input(false);
  readonly selected = input(false);
  readonly muted = input(false);
}
