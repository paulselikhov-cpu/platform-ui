import { Component, computed, inject, signal } from '@angular/core';
import { DistrictNewsFeed } from '../../../../shared/components/district-news-feed/district-news-feed';
import { NotificationSettingsMenu } from '../../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictInfoMenu } from '../../../../shared/menu/district-info-menu/district-info-menu';
import { DistrictSettingsMenu } from '../../../../shared/menu/district-settings-menu/district-settings-menu';
import { CurrentChatUserService } from '../../../../services/current-chat-user.service';
import { ChatRole } from '../../../../models/chatUser/chatUser.interface';

/**
 * Экран вкладки «Район»: новости, уведомления и сведения о районе.
 *
 * Мобильный вариант того, что на десктопе разнесено по правой панели
 * (`CharacterPanel` — новости) и окнам NavRail (уведомления, информация,
 * настройки района). Содержимое — те же компоненты, поэтому список новостей
 * и настройки везде одинаковые.
 */
@Component({
  selector: 'app-district-tab-view',
  imports: [DistrictNewsFeed, NotificationSettingsMenu, DistrictInfoMenu, DistrictSettingsMenu],
  templateUrl: './district-tab-view.html',
  styleUrl: './district-tab-view.scss',
})
export class DistrictTabView {
  /** Открытый сегмент. По умолчанию новости — то, что район сообщает сам. */
  readonly segment = signal<'news' | 'notifications' | 'info'>('news');

  private readonly currentUserService = inject(CurrentChatUserService);

  /** Настройки района доступны только ADMIN/MODERATOR. */
  readonly isStaff = computed(() => {
    const role = this.currentUserService.currentChatUser()?.role;
    return role === ChatRole.ADMIN || role === ChatRole.MODERATOR;
  });
}