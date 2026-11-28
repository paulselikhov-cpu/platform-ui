import { Component, input, output } from '@angular/core';
import type { DefaultBase, DefaultSize } from '../../default-base';

export type ButtonType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';
export type ButtonSize = DefaultSize;

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
export class DefaultButtonComponent implements DefaultBase<ButtonSize> {
  readonly label = input<string>();
  readonly ariaLabel = input<string>();
  readonly icon = input<string>();
  readonly disabled = input(false);
  readonly isActive = input(false);
  readonly fullWidth = input(true);
  readonly stopClickPropagation = input(false);
  readonly type = input<ButtonType>('secondary');
  readonly size = input<ButtonSize>('m');
  readonly buttonClick = output<void>();

  onButtonClick(event: MouseEvent): void {
    if (this.stopClickPropagation()) {
      event.stopPropagation();
    }
    this.buttonClick.emit();
  }
}