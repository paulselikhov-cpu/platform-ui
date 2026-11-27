import { Component, input, output } from '@angular/core';
import type { DefaultBase, DefaultSize } from '../default-base';

export type DefaultInputSize = DefaultSize | 'xxs';

@Component({
  selector: 'app-default-input',
  standalone: true,
  templateUrl: './default-input.component.html',
  styleUrl: './default-input.component.scss',
  host: {
    '[style.width]': 'width()',
    '[attr.data-size]': 'size()',
  },
})
export class DefaultInput implements DefaultBase<DefaultInputSize> {
  readonly value = input<string | number>('');
  readonly type = input<'text' | 'number' | 'search' | 'email' | 'password'>('text');
  readonly size = input<DefaultInputSize>('m');
  readonly min = input<number | undefined>(undefined);
  readonly max = input<number | undefined>(undefined);
  readonly placeholder = input('');
  readonly autocomplete = input<string | null>(null);
  readonly disabled = input(false);
  readonly align = input<'left' | 'right'>('left');
  /** Ширина хоста: '70px', '100%' и т.п. */
  readonly width = input('100%');

  readonly valueChange = output<string | number>();

  onInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    if (this.type() === 'number') {
      if (raw.trim() === '') return;
      const n = Number(raw);
      if (Number.isNaN(n)) return;
      this.valueChange.emit(n);
    } else {
      this.valueChange.emit(raw);
    }
  }
}