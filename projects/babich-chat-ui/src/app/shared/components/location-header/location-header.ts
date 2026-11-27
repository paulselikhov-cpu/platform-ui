import { Component, input } from '@angular/core';
import { ActionsMenu } from '../actions-menu/actions-menu';
import { RoomMenuItem } from '../actions-menu/room-menu-item.interface';

/**
 * Универсальная шапка панели локации/комнаты: иконка, заголовок,
 * подзаголовок (или «печатает…»), меню «⋮» и произвольный контент справа через
 * ng-content (например меню присутствия локации).
 *
 * Используется и главным меню локации, и экраном раздела, и чатом комнаты —
 * поэтому ничего не знает ни про конкретную локацию, ни про комнату. Источник
 * пунктов «⋮» задаёт владелец: главное меню и раздел передают
 * `LocationFeature.menuItems`, комната — `resolveRoomActions()`.
 */
@Component({
  selector: 'app-location-header',
  imports: [ActionsMenu],
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
  /**
   * Пункты меню «⋮» — действия того, что открыто. Пусто — кнопка не рисуется.
   * Главное меню и раздел фичи передают `LocationFeature.menuItems`,
   * комната — `resolveRoomActions()`.
   */
  readonly menuItems = input<RoomMenuItem[]>([]);
  /** Текст статуса подключения справа (например «● онлайн»); null — не показывать. */
  readonly statusText = input<string | null>(null);
  /** Статус подключения активен. */
  readonly statusOnline = input(false);
}
