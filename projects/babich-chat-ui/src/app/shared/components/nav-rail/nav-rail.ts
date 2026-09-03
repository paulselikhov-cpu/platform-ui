import { Component, computed, inject, output } from '@angular/core';
import { UnreadBadge } from '../unread-badge/unread-badge';
import { NotificationUnreadService } from '../../../services/notification-unread.service';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { ChatRole } from '../../../models/chatUser/chatUser.interface';

export type NavRailTab = 'home' | 'settings' | 'info' | 'notification' | 'applications' | 'district-settings';
export type NavRailAction = 'create' | 'find' | 'work';

@Component({
  selector: 'app-nav-rail',
  templateUrl: './nav-rail.html',
  styleUrl: './nav-rail.scss',
  standalone: true,
  imports: [UnreadBadge],
})
export class NavRail {
  readonly tabSelected = output<NavRailTab>();
  readonly actionSelected = output<NavRailAction>();

  private readonly notificationUnreadService = inject(NotificationUnreadService);
  private readonly currentUserService = inject(CurrentChatUserService);

  readonly unreadNotifications = this.notificationUnreadService.count;

  /** Настройки района (админка) видны только ADMIN/MODERATOR. */
  readonly isStaff = computed(() => {
    const role = this.currentUserService.currentChatUser()?.role;
    return role === ChatRole.ADMIN || role === ChatRole.MODERATOR;
  });

  onTabClick(tab: NavRailTab) {
    this.tabSelected.emit(tab);
  }

  onActionClick(action: NavRailAction) {
    this.actionSelected.emit(action);
  }
}