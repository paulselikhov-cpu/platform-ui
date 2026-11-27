import { Component, signal } from '@angular/core';
import { DistrictNewsFeed } from '../../../../shared/components/district-news-feed/district-news-feed';
import { NotificationSettingsMenu } from '../../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictInfoMenu } from '../../../../shared/menu/district-info-menu/district-info-menu';
import { DefaultButtonComponent } from '../../../../shared/components/buttons/default-button/default-button';

/**
 * Экран вкладки «Район»: новости, уведомления и сведения о районе.
 *
 */
@Component({
  selector: 'app-district-tab-view',
  imports: [DistrictNewsFeed, NotificationSettingsMenu, DistrictInfoMenu, DefaultButtonComponent],
  templateUrl: './district-tab-view.html',
  styleUrl: './district-tab-view.scss',
})
export class DistrictTabView {
  /** Открытый Таб. По умолчанию новости — то, что район сообщает сам. */
  readonly segment = signal<'news' | 'notifications' | 'info'>('news');
}