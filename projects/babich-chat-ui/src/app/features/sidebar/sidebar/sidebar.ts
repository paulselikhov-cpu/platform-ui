import { Component, inject, output, OnInit, signal } from '@angular/core';
import { LocationService } from '../../../services/chat/http/location.service';
import { LocationItem } from '../location-item/location-item';
import { AuthService } from '../../../services/auth/auth.service';
import { ILocation } from '../../../models/location/location.interface';
import { ConfirmModal, ConfirmModalConfig } from '../../../shared/components/confirm-modal/confirm-modal';
import { UserMenu } from '../../../shared/components/user-menu/user-menu';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem, ConfirmModal, UserMenu],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  locationSelected = output<ILocation>();
  createLocation = output<void>();
  findLocation = output<void>(); // output для кнопки поиска

  locations = signal<ILocation[]>([]);
  loading = signal(true);
  selectedId = signal<number | null>(null);

  showModal = signal(false);
  modalLocation = signal<ILocation | null>(null);
  modalAction = signal<'leave' | 'delete'>('leave');
  actionLoading = signal(false);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    // загружаем только МОИ локации — где я участник
    this.locationService.getMyLocations(user.userId).subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectLocation(location: ILocation) {
    this.selectedId.set(location.id);
    this.locationSelected.emit(location);
  }

  // обновить список после вступления в новую локацию
  refresh(callback?: () => void) {
    const user = this.authService.currentUser();
    if (!user) return;

    this.locationService.getMyLocations(user.userId).subscribe({
      next: (locations) => {
        this.locations.set(locations);
        callback?.();
      }
    });
  }

  setSelected(locationId: number) {
    this.selectedId.set(locationId);
  }

  onContextAction(event: { action: 'leave' | 'delete', location: ILocation }) {
    this.modalLocation.set(event.location);
    this.modalAction.set(event.action);
    this.showModal.set(true);
  }

  confirmAction() {
    const user = this.authService.currentUser();
    const location = this.modalLocation();
    if (!user || !location) return;

    this.actionLoading.set(true);

    const action$ = this.modalAction() === 'delete'
      ? this.locationService.deleteLocation(location.id, user.userId)
      : this.locationService.leaveLocation(location.id, user.userId);

    action$.subscribe({
      next: () => {
        this.showModal.set(false);
        this.actionLoading.set(false);
        this.refresh(); // обновляем список
      },
      error: () => this.actionLoading.set(false)
    });
  }

  cancelAction() {
    this.showModal.set(false);
    this.modalLocation.set(null);
  }

  // добавь геттер для конфига
  get modalConfig(): ConfirmModalConfig {
    const loc = this.modalLocation();
    return this.modalAction() === 'delete'
      ? {
          icon: '🗑',
          title: 'Удалить локацию?',
          message: `Вы собираетесь удалить локацию <strong>${loc?.name}</strong>. Все комнаты и история сообщений будут удалены безвозвратно!`,
          confirmText: 'Удалить',
          cancelText: 'Отмена',
        }
      : {
          icon: '🚪',
          title: 'Покинуть локацию?',
          message: `Вы точно хотите покинуть локацию <strong>${loc?.name}</strong>?`,
          confirmText: 'Покинуть',
          cancelText: 'Отмена',
        };
  }
}