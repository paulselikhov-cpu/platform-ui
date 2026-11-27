import { Component, input, output } from '@angular/core';
import { DefaultButtonComponent } from '../default-button/default-button';
import type { DefaultSize } from '../../default-base';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
  imports: [DefaultButtonComponent],
})
export class BackButton {
  readonly back = output<void>();
  readonly fullWidth = input(true);
  readonly size = input<DefaultSize>('xs');
}
