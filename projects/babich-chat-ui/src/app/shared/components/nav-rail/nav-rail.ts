import { Component, computed, inject, output } from '@angular/core';
import { UnreadBadge } from '../unread-badge/unread-badge';
import { buildNavItems } from '../../nav/nav-items.factory';
import { NavItem, NavGroup, pickCommand, visibleNavItems } from '../../nav/nav-item.interface';

/**
 * Левая вертикальная колонка десктопной раскладки: пункты навигации
 * приложения, сгруппированные по экранам мобильных табов.
 *
 * Список, условия видимости и бейджи берутся из `buildNavItems()` — единственного
 * источника пунктов, поэтому мобильные табы показывают ровно то же, что и эта
 * колонка, и пункт, добавленный один раз, появляется везде.
 */
@Component({
  selector: 'app-nav-rail',
  templateUrl: './nav-rail.html',
  styleUrl: './nav-rail.scss',
  standalone: true,
  imports: [UnreadBadge],
})
export class NavRail {
  /** Выбран пункт — раскладка выполняет его команду (модалка или переход). */
  readonly itemSelected = output<NavItem>();

  /** Порядок групп в колонке: сначала разделы района, затем локации и персонаж. */
  private readonly groupOrder: readonly NavGroup[] = ['locations', 'district', 'profile'];

  /** Видимые пункты, разложенные по группам в порядке колонки. */
  readonly sections = computed(() => {
    const items = visibleNavItems(this.allItems);
    return this.groupOrder
      .map((group) => ({ group, items: items.filter((item) => item.group === group) }))
      .filter((section) => section.items.length > 0);
  });

  private readonly allItems = buildNavItems();

  /**
   * Десктоп умеет и модальные окна, и переходы; порядок команд в пункте
   * задаёт предпочтение — модалка для районных разделов и настроек.
   */
  readonly modalTabOf = (item: NavItem) => {
    const command = pickCommand(item, ['open-modal']);
    return command.type === 'open-modal' ? command.tab : null;
  };

  /**
   * Клик по пункту. Отключённый пункт тоже эмитится: раскладка нажатия
   * объясняет, чего не хватает, и уводит на экран, где это решается
   * (см. `disabled` в `buildNavItems`).
   */
  select(item: NavItem): void {
    this.itemSelected.emit(item);
  }
}