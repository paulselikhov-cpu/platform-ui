import { Component, input, output } from '@angular/core';
import { ActionsMenu } from '../actions-menu/actions-menu';
import { RoomMenuItem } from '../actions-menu/room-menu-item.interface';
import { BackButton } from '../back-button/back-button';

/**
 * Универсальная шапка панели локации/комнаты: кнопка «назад», иконка, заголовок,
 * подзаголовок (или «печатает…»), меню «⚡ Действия» и произвольный контент
 * справа через ng-content (например меню присутствия локации).
 *
 * Используется и главным меню локации, и экраном раздела, и чатом комнаты —
 * поэтому ничего не знает ни про конкретную локацию, ни про комнату.
 */
@Component({
  selector: 'app-location-header',
  imports: [ActionsMenu, BackButton],
  templateUrl: './location-header.html',
  styleUrl: './location-header.scss',
})
export class LocationHeader {
  /** Иконка слева (эмодзи). */
  readonly icon = input<string>('#');
  /** Заголовок (имя локации/комнаты/раздела). */
  readonly title = input.required<string>();
  /** Подзаголовок (описание) — показывается, если не задан typingText. */
  readonly subtitle = input<string | null>(null);
  /** Текст «печатает…» (комната) — заменяет подзаголовок, если задан. */
  readonly typingText = input<string | null>(null);
  /** Пункты меню «⚡ Действия» (пусто — меню не показывается). */
  readonly menuItems = input<RoomMenuItem[]>([]);
  /** Показывать ли кнопку «назад» слева. */
  readonly showBack = input(false);
  /** Текст статуса подключения справа (например «● онлайн»); null — не показывать. */
  readonly statusText = input<string | null>(null);
  /** Статус подключения активен. */
  readonly statusOnline = input(false);

  /** Нажата кнопка «назад». */
  readonly back = output<void>();
}
