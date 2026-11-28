import { Component, computed, inject, input, output } from '@angular/core';
import { UnreadBadge } from '../../unread-badge/unread-badge';
import { NotificationUnreadService } from '../../../../services/notification-unread.service';
import { MobileTab } from '../../../../layout/chat-shell/chat-shell-state';
import { DefaultTabsSet } from '../../default-tabs-set/default-tabs-set';
import type { DefaultTabOption, DefaultTabsSetSize } from '../../default-tabs-set/default-tabs-set';

/**
 * Нижняя навигация мобильной раскладки: «Локации», «Район», «Персонаж».
 *
 * Активная вкладка приходит из маршрута, поэтому состояние переживает F5 и
 * открывается по прямой ссылке. Бейдж уведомлений на «Районе» повторяет
 * привычку десктопной колонки — те же данные из `NotificationUnreadService`.
 */
@Component({
  selector: 'app-mobile-tab-bar',
  imports: [DefaultTabsSet, UnreadBadge],
  templateUrl: './mobile-tab-bar.html',
  styleUrl: './mobile-tab-bar.scss',
})
export class MobileTabBar {
  private readonly unreadService = inject(NotificationUnreadService);

  /**
   * Активная вкладка. `null` — не подсвечивать ни одну, например на экране
   * настроек, который открыт поверх выбранной вкладки.
   */
  readonly active = input.required<MobileTab | null>();
  readonly size = input<DefaultTabsSetSize>('l');
  /** Выбрана вкладка — раскладка выполняет переход. */
  readonly tabSelected = output<MobileTab>();

  readonly unreadNotifications = this.unreadService.count;
  readonly tabs = computed<DefaultTabOption[]>(() => [
    { id: 'locations', label: 'Локации', icon: '🏠' },
    { id: 'district', label: 'Район', icon: '🏛️' },
    { id: 'profile', label: 'Персонаж', icon: '🧍' },
  ]);

  onTabSelected(tab: string): void {
    if (tab === 'locations' || tab === 'district' || tab === 'profile') {
      this.tabSelected.emit(tab);
    }
  }
}