import { inject } from '@angular/core';
import { NavItem } from './nav-item.interface';
import { CurrentChatUserService } from '../../services/current-chat-user.service';
import { NotificationUnreadService } from '../../services/notification-unread.service';
import { ChatRole } from '../../models/chatUser/chatUser.interface';

/**
 * Единственный источник пунктов навигации приложения: список, условия
 * видимости, доступность и бейджи. Раскладки (десктопный NavRail, мобильные
 * табы) получают готовые данные и только рисуют их — поэтому пункт,
 * добавленный здесь, появляется везде сразу и не может «потеряться» на одной
 * из платформ.
 *
 * Группы соответствуют экранам мобильной навигации:
 * `locations` (список локаций, создание и поиск), `district` (уведомления,
 * информация и настройки района), `profile` (настройки приложения, работы).
 *
 * Действия фичи локации (меню `⋮`) сюда не входят: их источник — сама фича
 * (`LocationFeature.menuItems`), они привязаны к открытой локации, а не к
 * аккаунту. Поэтому `⋮` всегда означает «действия того, что открыто».
 */
export function buildNavItems(): NavItem[] {
  const currentUser = inject(CurrentChatUserService);
  const unread = inject(NotificationUnreadService);

  /** Настройки района доступны только ADMIN/MODERATOR. */
  const isStaff = (): boolean => {
    const role = currentUser.currentChatUser()?.role;
    return role === ChatRole.ADMIN || role === ChatRole.MODERATOR;
  };

  /** Меню «Работы» открывается, когда у персонажа есть паспорт и лицензия. */
  const hasWorkLicence = (): boolean => {
    const user = currentUser.currentChatUser();
    return Boolean(user?.passportId && user?.workLicenceId);
  };

  return [
    // ── Локации ──────────────────────────────────────────────────────────
    {
      id: 'nav.locations.home',
      icon: '🏠',
      label: 'Главная',
      group: 'locations',
      commands: [{ type: 'navigate', commands: ['/chat'] }],
    },
    {
      id: 'nav.locations.create',
      icon: '➕',
      label: 'Создать локацию',
      group: 'locations',
      commands: [{ type: 'navigate', commands: ['/chat/location/create'] }],
    },
    {
      id: 'nav.locations.find',
      icon: '🔍',
      label: 'Найти локацию',
      group: 'locations',
      commands: [{ type: 'navigate', commands: ['/chat/location/find'] }],
    },

    // ── Район ────────────────────────────────────────────────────────────
    {
      id: 'nav.district.notifications',
      icon: '🔔',
      label: 'Уведомления',
      group: 'district',
      commands: [
        { type: 'open-modal', tab: 'notification' },
        { type: 'navigate', commands: ['/chat/district'] },
      ],
      badge: () => unread.count(),
    },
    {
      id: 'nav.district.info',
      icon: 'ℹ️',
      label: 'Информация о районе',
      group: 'district',
      commands: [
        { type: 'open-modal', tab: 'info' },
        { type: 'navigate', commands: ['/chat/district'] },
      ],
    },
    {
      id: 'nav.district.settings',
      icon: '🛠️',
      label: 'Настройки района',
      group: 'district',
      commands: [
        { type: 'open-modal', tab: 'district-settings' },
        { type: 'navigate', commands: ['/chat/district'] },
      ],
      visible: isStaff,
    },

    // ── Персонаж ─────────────────────────────────────────────────────────
    {
      id: 'nav.profile.settings',
      icon: '⚙️',
      label: 'Настройки',
      group: 'profile',
      commands: [
        { type: 'open-modal', tab: 'user-settings' },
        { type: 'navigate', commands: ['/chat/settings'] },
      ],
    },
    {
      id: 'nav.profile.work',
      icon: '🧹',
      label: 'Работать',
      group: 'profile',
      commands: [{ type: 'navigate', commands: ['/chat/work'] }],
      // Пункт остаётся активным без лицензии: нажатие объясняет, что её надо
      // получить, и ведёт на экран работ — серая кнопка ничего не сообщает.
      disabled: () => !hasWorkLicence(),
    },
  ];
}