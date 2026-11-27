import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { RoomView } from '../../../features/location/room-view/room-view';
import { LocationMain } from '../../../features/location/location-main/location-main';
import { LocationFeatureView } from '../../../features/location/location-feature-view/location-feature-view';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { FindLocation } from '../../../features/location/find-location/find-location';
import { NavRail } from '../../../shared/components/nav-rail/nav-rail';
import { WindowModal } from '../../../shared/components/modals/window-modal/window-modal';
import { SettingsMenu, type SettingsMenuPage } from '../../../shared/menu/settings-menu/settings-menu';
import { CharacterPanel } from '../../../shared/components/character-panel/character-panel';
import { RoomList } from '../../../features/location/room-list/room-list';
import { WorkPage } from '../../../features/economy/work-page/work-page';
import { DistrictInfoMenu } from '../../../shared/menu/district-info-menu/district-info-menu';
import { NotificationSettingsMenu } from '../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictSettingsMenu } from '../../../shared/menu/district-settings-menu/district-settings-menu';
import { MessageService } from '../../../services/message.service';
import { ChatShellState } from '../../chat-shell/chat-shell-state';
import { NavItem, NavModalTab, pickCommand } from '../../../shared/nav/nav-item.interface';

/**
 * Десктопная раскладка чата: рамка окна, левая панель (NavRail + сайдбар
 * локаций/комнат), основная панель и правая панель персонажа.
 *
 * Содержит только разметку: что открыто (локация, комната, раздел) и как
 * переходить между экранами — в `ChatShellState`, общем для обеих раскладок.
 * Модальные окна, открываемые из NavRail, — локальное состояние этой
 * раскладки, на мобике им соответствует полноэкранный `/chat/settings`.
 */
@Component({
  selector: 'app-chat-desktop',
  imports: [
    Sidebar, LocationEmpty, RoomView, LocationMain, LocationFeatureView, CreateLocation, FindLocation,
    NavRail, CharacterPanel, RoomList, SettingsMenu, WorkPage, DistrictInfoMenu, NotificationSettingsMenu, DistrictSettingsMenu,
    WindowModal
  ],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop {

  readonly state = inject(ChatShellState);

  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);

  /** Открытое окно NavRail; null — все окна закрыты. */
  readonly activeModal = signal<NavModalTab | null>(null);

  constructor() {
    if (this.router.url.startsWith('/chat/district/info')) {
      this.activeModal.set('info');
    }
  }

  closeModal() {
    if (this.state.panel() === 'settings') {
      this.state.onSettingsBack();
      return;
    }
    this.activeModal.set(null);
  }

  onSettingsPageChange(page: SettingsMenuPage): void {
    void this.state.onSettingsPageSelected(page).then((navigated) => {
      if (navigated) this.activeModal.set(null);
    });
  }

  onNavItem(item: NavItem): void {
    const command = pickCommand(item, ['open-modal', 'navigate']);

    if (command.type === 'navigate') {
      // Пункт недоступен (например работа без лицензии) — вместо перехода
      // объясняем, чего не хватает, и ведём на экран, где это решается.
      if (item.id === 'nav.profile.work' && item.disabled?.()) {
        this.messageService.warning(
          'Чтобы работать, нужны паспорт и лицензия на работу. Подайте заявку в разделе «Работы».',
        );
      }
      this.router.navigate([...command.commands]);
      return;
    }

    // Повторный клик по активной вкладке закрывает окно.
    this.activeModal.set(this.activeModal() === command.tab ? null : command.tab);
  }
}
