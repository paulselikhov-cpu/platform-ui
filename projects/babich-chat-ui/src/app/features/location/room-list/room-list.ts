import { Component, input, output, inject, effect, computed } from '@angular/core';
import { IRoom } from '../../../models/location/location.interface';
import { UnreadTrackingSidebarService } from '../../sidebar/service/unread-tracking-sidebar.service';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { UnreadBadge } from '../../../shared/components/unread-badge/unread-badge';
import type { DefaultSize } from '../../../shared/components/default-base';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.html',
  styleUrl: './room-list.scss',
  standalone: true,
  imports: [UnreadBadge],
  host: {
    '[attr.data-size]': 'size()',
  },
})
export class RoomList {
  readonly size = input<DefaultSize>('m');
  rooms = input.required<IRoom[]>();
  selectedRoom = input<IRoom | null>(null);
  /** Активна ли кнопка «Главная» (роут `location/:id/main`, без комнаты и раздела). */
  activeHome = input(false);
  /**
   * Показывать кнопку «Главная» над списком комнат. Нужна там, где список
   * комнат — отдельный экран (десктопный сайдбар). На мобиле главное меню
   * локации нарисовано на том же экране, поэтому пункт скрыт: он вёл бы
   * на уже открытый экран.
   */
  showHome = input(true);
  locationId = input.required<number>(); // ← нужен для загрузки разбивки

  roomSelected = output<IRoom>();
  /** Нажата кнопка «Главная» — возврат в главное меню локации. */
  homeSelected = output<void>();

  private readonly unreadTrackingSidebarService = inject(UnreadTrackingSidebarService);
  private readonly auth = inject(AuthService);

  /** unread по комнатам текущей локации — один сигнал на весь список. */
  readonly roomUnread = computed(
    () => this.unreadTrackingSidebarService.roomCountsFor(this.locationId())(),
  );

  constructor() {
    effect(() => {
      const locId = this.locationId();
      const characterId = this.auth.currentUser()?.userId;
      if (locId && characterId) {
        this.unreadTrackingSidebarService.loadRoomBreakdown(locId, characterId);
      }
    });
  }

  unreadFor(roomId: number): number {
    return this.roomUnread().get(roomId) ?? 0;
  }
}