import { Component, output } from '@angular/core';
import { DefaultButtonComponent } from '../buttons/default-button/default-button';

@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
  imports: [DefaultButtonComponent],
})
export class BackButton {
  readonly back = output<void>();
}
