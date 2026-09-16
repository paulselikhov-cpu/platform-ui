import { Component, input, output } from '@angular/core';

/**
 * Универсальная кнопка «назад» (стрелка ← + подпись).
 * Используется в под-экранах контент-панелей фич комнат
 * (гражданские заявки и т.п.) для возврата к основному виду.
 */
@Component({
  selector: 'app-back-button',
  standalone: true,
  templateUrl: './back-button.html',
  styleUrl: './back-button.scss',
})
export class BackButton {
  /** Подпись рядом со стрелкой. */
  readonly label = input<string>('Назад');
  /** Событие возврата — обработчик вешает родительский вид. */
  readonly back = output<void>();
}
