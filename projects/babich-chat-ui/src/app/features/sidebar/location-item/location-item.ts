import { Component, input, output, computed, inject, viewChild } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';
import { OnlineTrackingSidebarService } from '../service/online-tracking-sidebar.service';
import { UnreadTrackingSidebarService } from '../service/unread-tracking-sidebar.service';
import { ActionsMenu } from '../../../shared/components/actions-menu/actions-menu';
import { RoomMenuItem } from '../../../shared/components/actions-menu/room-menu-item.interface';

@Component({
  selector: 'app-location-item',
  imports: [ActionsMenu],
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  readonly location = input.required<ILocation>();
  readonly isActive = input<boolean>(false);

  readonly contextAction = output<{ action: 'leave' | 'delete', location: ILocation }>();

  // Онлайн-трекер
  private readonly onlineTrackingSidebarService = inject(OnlineTrackingSidebarService);
  readonly onlineCountTotal = computed(() =>
    this.onlineTrackingSidebarService.countFor(this.location().id)()
  );

  // Unread-трекер
  private readonly unreadTrackingSidebarService = inject(UnreadTrackingSidebarService);
  readonly unreadCountTotal = computed(() =>
    this.unreadTrackingSidebarService.totalFor(this.location().id)()
  );

  // Контекстное меню
  private readonly menu = viewChild.required(ActionsMenu);
  private pressTimer: ReturnType<typeof setTimeout> | null = null;

  get isOwner(): boolean {
    return this.location().memberRole === 'OWNER';
  }

  /** Владелец удаляет локацию, остальные участники покидают её. */
  readonly menuItems = computed<RoomMenuItem[]>(() =>
    this.location().memberRole === 'OWNER'
      ? [{ id: 'delete', icon: '🗑', label: 'Удалить локацию', danger: true, run: () => this.onAction('delete') }]
      : [{ id: 'leave', icon: '🚪', label: 'Покинуть локацию', danger: true, run: () => this.onAction('leave') }],
  );

  onContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.menu().openAt(event.clientX, event.clientY);
  }

  // Долгое нажатие на телефоне
  onTouchStart(event: TouchEvent): void {
    this.cancelPress();
    this.pressTimer = setTimeout(() => {
      const touch = event.touches[0];
      this.menu().openAt(touch.clientX, touch.clientY);
    }, 600);
  }

  onTouchEnd(): void {
    this.cancelPress();
  }

  onTouchMove(): void {
    this.cancelPress();
  }

  onAction(action: 'leave' | 'delete'): void {
    this.contextAction.emit({ action, location: this.location() });
  }

  private cancelPress(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }
}