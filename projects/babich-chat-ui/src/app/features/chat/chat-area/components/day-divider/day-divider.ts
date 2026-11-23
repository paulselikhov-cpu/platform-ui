import { Component, input } from '@angular/core';

/**
 * Разделитель дней в ленте сообщений: подпись «Сегодня» / «Вчера» / дата
 * по центру с линиями по сторонам. Показывается одинаково на десктопе
 * и на мобиле, чтобы вид ленты не зависел от ширины окна.
 */
@Component({
  selector: 'app-day-divider',
  templateUrl: './day-divider.html',
  styleUrl: './day-divider.scss',
})
export class DayDivider {
  /** Подпись раздела (например «Сегодня»). */
  readonly label = input.required<string>();
}