import { Component, input } from '@angular/core';

export type ButtonType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
export type ButtonSize = 'xs' | 's' | 'm' | 'l';

@Component({
  selector: 'default-button',
  standalone: true,
  templateUrl: './default-button.html',
  styleUrl: './default-button.scss',
  host: {
    '[class.is-disabled]': 'disabled()',
    '[class.is-active]': 'isActive()',
    '[class.is-full-width]': 'fullWidth()',
    '[attr.data-type]': 'type()',
    '[attr.data-size]': 'size()',
  },
})
export class DefaultButtonComponent {
  readonly label = input<string>();
  readonly icon = input<string>();
  readonly disabled = input(false);
  readonly isActive = input(false);
  readonly fullWidth = input(true);
  readonly type = input<ButtonType>('secondary');
  readonly size = input<ButtonSize>('m');
}