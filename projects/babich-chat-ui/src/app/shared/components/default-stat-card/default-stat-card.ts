import { Component, input } from '@angular/core';

export type DefaultStatCardVariant = 'default' | 'warning' | 'success' | 'accent';

@Component({
  selector: 'default-stat-card',
  standalone: true,
  templateUrl: './default-stat-card.html',
  styleUrl: './default-stat-card.scss',
  host: {
    '[attr.data-variant]': 'variant()',
  },
})
export class DefaultStatCard {
  readonly label = input('');
  readonly value = input<string | number>('');
  readonly variant = input<DefaultStatCardVariant>('default');
}
