import { Component, inject, output, OnInit, signal, computed, effect } from '@angular/core';
import { LocationItem } from '../location-item/location-item';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { ILocation } from '../../../models/location/location.interface';
import { ConfirmModal, ConfirmModalConfig } from '../../../shared/components/confirm-modal/confirm-modal';
import { UserMenu } from '../../../shared/components/user-menu/user-menu';
import { WalletWidget } from '../../economy/wallet-widget/wallet-widget';
import { OnlineTrackingSidebarService } from '../service/online-tracking-sidebar.service';
import { UnreadTrackingSidebarService } from '../service/unread-tracking-sidebar.service';
import { LocationService } from '../../../services/backend-services/http/location.service';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { ChatUserService } from '../../../services/backend-services/http/chat-user.service';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';
import { District } from '../../../models/district/district.interface';
import { PublicLocationType, PUBLIC_LOCATION_TYPE_LABELS } from '../../../models/district/public-location-type.enum';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem, ConfirmModal, UserMenu, WalletWidget],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private readonly locationService = inject(LocationService);
  private readonly districtService = inject(DistrictService);
  private readonly authService = inject(AuthService);
  private readonly chatUserService = inject(ChatUserService);
  private readonly onlineTrackingSidebarService = inject(OnlineTrackingSidebarService);
  private readonly unreadTrackingSidebarService = inject(UnreadTrackingSidebarService);

  locationSelected = output<ILocation>();
  systemLocationSelected = output<ILocation>();
  createLocation = output<void>();
  findLocation = output<void>(); // output для кнопки поиска

  locations = signal<ILocation[]>([]);
  districts = signal<District[]>([]);
  loading = signal(true);
  districtsLoading = signal(true);
  selectedId = signal<number | null>(null);

  // Только приватные локации (не системные)
  readonly userLocations = computed(() =>
    this.locations().filter(l => !l.isSystem)
  );

  // Только системные локации
  readonly systemLocations = computed(() =>
    this.locations().filter(l => l.isSystem)
  );
  readonly user = this.authService.currentUser;
  readonly publicLocationLabels = PUBLIC_LOCATION_TYPE_LABELS;
  readonly systemLocationIcons: Record<string, string> = {
    [PublicLocationType.CITY_HALL]: '🏛️',
    [PublicLocationType.LENIN_SQUARE]: '📢',
    [PublicLocationType.POLICE_STATION]: '👮',
    [PublicLocationType.PRISON]: '🔒',
    [PublicLocationType.BANK]: '🏦',
    [PublicLocationType.WAREHOUSE]: '📦',
    [PublicLocationType.GENERAL_MARKET]: '🛒',
    [PublicLocationType.REAL_ESTATE_MARKET]: '🏘️',
  };

  showModal = signal(false);
  modalLocation = signal<ILocation | null>(null);
  modalAction = signal<'leave' | 'delete'>('leave');
  actionLoading = signal(false);

  // В компоненте
  readonly chatUser = toSignal<IChatUser | null>(
    toObservable(this.user).pipe(
      switchMap(user => {
        if (user?.userId) {
          return this.chatUserService.getChatUserByUserId(user.userId);
        }
        return of(null);
      }),
    ),
    { initialValue: null }
  );

  constructor() {
    effect(() => {
      const ids = this.locations().map(l => l.id);
      if (ids.length) {
        this.onlineTrackingSidebarService.track(ids).subscribe();
        this.unreadTrackingSidebarService.track(ids).subscribe();
      }
    });

    effect(() => {
      const chatUser = this.chatUser();
      if (!chatUser) return; // ждём, пока подтянется

      this.loading.set(true);
      this.locationService.getMyLocations(chatUser.id).subscribe({
        next: (locations) => {
          this.locations.set(locations);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
    });
  }

  ngOnInit() {
    // загружаем районы и системные локации
    this.districtService.getAllDistricts().subscribe({
      next: (districts) => {
        this.districts.set(districts);
        this.districtsLoading.set(false);
      },
      error: () => this.districtsLoading.set(false)
    });
  }

  selectLocation(location: ILocation) {
    this.selectedId.set(location.id);
    this.locationSelected.emit(location);
  }

  selectSystemLocation(location: ILocation) {
    this.selectedId.set(location.id);
    this.systemLocationSelected.emit(location);
  }

  getSystemLocationIcon(type?: string): string {
    return type && this.systemLocationIcons[type] ? this.systemLocationIcons[type] : '🏛️';
  }

  // обновить список после вступления в новую локацию
  refresh(callback?: () => void) {
    const chatUser = this.chatUser();
    if (!chatUser) return;

    this.locationService.getMyLocations(chatUser.id).subscribe({
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
    const chatUser = this.chatUser();
    const location = this.modalLocation();
    if (!chatUser || !location) return;

    this.actionLoading.set(true);

    const action$ = this.modalAction() === 'delete'
      ? this.locationService.deleteLocation(location.id, chatUser.id)
      : this.locationService.leaveLocation(location.id, chatUser.id);

    action$.subscribe({
      next: () => {
        this.showModal.set(false);
        this.actionLoading.set(false);
        this.refresh();
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