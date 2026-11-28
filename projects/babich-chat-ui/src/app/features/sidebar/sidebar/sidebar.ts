import { booleanAttribute, Component, inject, input, model, output, OnInit, signal, computed, effect } from '@angular/core';
import { LocationItem } from '../location-item/location-item';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { ILocation } from '../../../models/location/location.interface';
import { ConfirmModal, ConfirmModalConfig } from '../../../shared/components/modals/confirm-modal/confirm-modal';
import { OnlineTrackingSidebarService } from '../service/online-tracking-sidebar.service';
import { UnreadTrackingSidebarService } from '../service/unread-tracking-sidebar.service';
import { LocationService } from '../../../services/backend-services/http/location.service';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { of, switchMap } from 'rxjs';
import { ChatUserService } from '../../../services/backend-services/http/chat-user.service';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';
import { District } from '../../../models/district/district.interface';
import { LOCATION_TYPE_LABELS, LocationType, SystemLocationCode } from '../../../models/location/location-type.enum';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DefaultInput } from '../../../shared/components/default-input/default-input.component';
import { DefaultTabsSet, DefaultTabOption } from '../../../shared/components/default-tabs-set/default-tabs-set';
import type { DefaultSize } from '../../../shared/components/default-base';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem, ConfirmModal, DefaultInput, DefaultTabsSet],
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
  private readonly currentChatUserService = inject(CurrentChatUserService);

  locationSelected = output<ILocation>();
  systemLocationSelected = output<ILocation>();
  createLocation = output<void>();
  findLocation = output<void>(); // output для кнопки поиска

  locations = signal<ILocation[]>([]);
  districts = signal<District[]>([]);
  loading = signal(true);
  showLoading = signal(false);
  districtsLoading = signal(true);
  selectedLocationTab = model<'mine' | 'system'>('mine');
  readonly locationTabs: DefaultTabOption[] = [
    { id: 'mine', label: 'Мои локации' },
    { id: 'system', label: 'Системные локации' },
  ];
  readonly size = input<DefaultSize>('l');
  myLocationsSearch = model('');
  systemLocationsSearch = model('');
  readonly searchInHeader = input(false, { transform: booleanAttribute });

  /** id активной локации из URL — источник подсветки (роутинг, а не localStorage). */
  activeLocationId = input<number | null>(null);

  // Только пользовательские локации (системные исключены).
  // Отличие определяется type = SYSTEM (флага is_system больше нет).
  readonly userLocations = computed(() => {
    return this.locations().filter(l => l.type !== LocationType.SYSTEM);
  });
  readonly filteredUserLocations = computed(() =>
    this.filterLocations(this.userLocations(), this.myLocationsSearch()),
  );

  // Только системные локации — источник: районы из /api/districts (не зависят от членства).
  // Фильтруем по району персонажа, чтобы не показывать системки чужих районов.
  readonly systemLocations = computed(() => {
    const districtId = this.chatUser()?.districtId;

    if (districtId == null) {
      return [];
    }

    const district = this.districts().find(
      district => district.id === districtId,
    );

    //TODO Временный фильтр
    const locations = (district?.systemLocations ?? []).map(location => ({
      ...location,
      disabled: 
        location.code !== SystemLocationCode.GENERAL_MARKET 
        && location.code !== SystemLocationCode.LENIN_SQUARE
        && location.code !== SystemLocationCode.CITY_HALL,
    }));

    return locations;
  });
  readonly filteredSystemLocations = computed(() =>
    this.filterLocations(
      this.systemLocations().filter(location => !location.disabled),
      this.systemLocationsSearch(),
    ),
  );
  readonly user = this.authService.currentUser;
  readonly locationTypeLabels = LOCATION_TYPE_LABELS;
  readonly systemLocationIcons: Record<string, string> = {
    [SystemLocationCode.CITY_HALL]: '🏛️',
    [SystemLocationCode.LENIN_SQUARE]: '📢',
    [SystemLocationCode.POLICE_STATION]: '👮',
    [SystemLocationCode.PRISON]: '🔒',
    [SystemLocationCode.BANK]: '🏦',
    [SystemLocationCode.WAREHOUSE]: '📦',
    [SystemLocationCode.GENERAL_MARKET]: '🛒',
    [SystemLocationCode.REAL_ESTATE_MARKET]: '🏘️',
  };

  showModal = signal(false);
  modalLocation = signal<ILocation | null>(null);
  modalAction = signal<'leave' | 'delete'>('leave');
  actionLoading = signal(false);

  /* TODO понять, нужна ли нам автоматическая отмена -  toObservable/rxjs тут используются не ради усложнения, а ради автоматической отмены устаревших запросов при switchMap.*/
  readonly chatUser = toSignal<IChatUser | null>(
    toObservable(this.user).pipe(
      switchMap(user => {
        const districtId = this.currentChatUserService.selectedDistrictId();
        if (user?.userId && districtId) {
          return this.chatUserService.getChatUserByUserIdAndDistrict(user.userId, districtId);
        }
        return of(null);
      }),
    ),
    { initialValue: null }
  );

  constructor() {
    effect((onCleanup) => {
      if (!this.loading()) {
        this.showLoading.set(false);
        return;
      }

      const timeoutId = setTimeout(() => this.showLoading.set(true), 200);
      onCleanup(() => clearTimeout(timeoutId));
    });

    effect(() => {
      // отслеживаем как приватные (членство), так и системные локации (публичные)
      const ids = [...this.userLocations(), ...this.systemLocations()].map(l => l.id);
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

  onLocationTabChange(tab: string): void {
    if (tab === 'mine' || tab === 'system') {
      this.selectedLocationTab.set(tab);
    }
  }

  private filterLocations(locations: ILocation[], query: string): ILocation[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return locations;

    return locations.filter(location =>
      location.name.toLowerCase().includes(normalizedQuery) ||
      (location.description?.toLowerCase().includes(normalizedQuery) ?? false),
    );
  }

  selectLocation(location: ILocation) {
    this.locationSelected.emit(location);
  }

  selectSystemLocation(location: ILocation) {
    this.systemLocationSelected.emit(location);
  }

  getSystemLocationIcon(code?: string): string {
    return code && this.systemLocationIcons[code] ? this.systemLocationIcons[code] : '🏛️';
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