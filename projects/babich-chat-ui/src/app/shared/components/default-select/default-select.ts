import { Component, input, output } from '@angular/core';
import type { DefaultBase, DefaultSize } from '../default-base';

export interface DefaultSelectOption {
  value: string | number;
  label: string;
}

export type DefaultSelectSize = DefaultSize;

@Component({
  selector: 'default-select',
  standalone: true,
  templateUrl: './default-select.html',
  styleUrl: './default-select.scss',
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class DefaultSelect implements DefaultBase<DefaultSelectSize> {
  readonly options = input<DefaultSelectOption[]>([]);
  readonly value = input<string | number | null>(null);
  readonly size = input<DefaultSelectSize>('m');
  readonly disabled = input(false);
  readonly ariaLabel = input('');

  readonly valueChange = output<string | number>();

  onChange(event: Event): void {
    const target = event.currentTarget;
    if (!(target instanceof HTMLSelectElement)) return;

    const option = this.options().find((item) => String(item.value) === target.value);
    if (option) this.valueChange.emit(option.value);
  }
}
