import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { Router } from '@angular/router';

import { ChatShellState, MobileTab } from '../../chat-shell/chat-shell-state';
import { resolveLocationIcon } from '../../../features/location/location-icons';
import { resolveRoomActions } from '../../../features/location/room-view/room-actions.factory';
import { ActionsMenu } from '../../../shared/components/actions-menu/actions-menu';
import { RoomMenuItem } from '../../../shared/components/actions-menu/room-menu-item.interface';
import { MobileTabBar } from '../../../shared/components/mobile/mobile-tab-bar/mobile-tab-bar';
import { SwipeBackDirective } from '../directives/swipe-back.directive';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { RoomList } from '../../../features/location/room-list/room-list';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { RoomView } from '../../../features/location/room-view/room-view';
import { LocationMain } from '../../../features/location/location-main/location-main';
import { LocationFeatureView } from '../../../features/location/location-feature-view/location-feature-view';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { FindLocation } from '../../../features/location/find-location/find-location';
import { WorkPage } from '../../../features/economy/work-page/work-page';
import { CharacterPanel } from '../../../shared/components/character-panel/character-panel';
import { DistrictTabView } from '../views/district-tab-view/district-tab-view';
import { SettingsScreen } from '../views/settings-screen/settings-screen';
import { MessageService } from '../../../services/message.service';
import { BackButton } from '../../../shared/components/buttons/back-button/back-button';
import { DefaultButtonComponent } from '../../../shared/components/buttons/default-button/default-button';
import { DefaultSteps } from '../../../shared/components/default-steps/default-steps';
import { DefaultInput } from '../../../shared/components/default-input/default-input.component';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { SETTINGS_PAGE_TITLES } from '../../../shared/menu/settings-menu/settings-menu';

/**
 * Мобильная раскладка чата (окно ≤ 900px): полноэкранные экраны, верхняя
 * шапка и нижний таб-бар «Локации / Район / Персонаж».
 *
 * Навигация полностью построена на маршрутах: активная вкладка приходит из
 * `ChatShellState.tab`, поэтому любой экран открывается прямой ссылкой и
 * переживает F5 — то же свойство, которое потом понадобится для deep-link
 * в нативном приложении.
 *
 * Таб-бар скрыт в комнате: там занимает место шапка с кнопкой «назад» —
 * полноэкранный чат должен выглядеть как мессенджер, а не как экран внутри
 * приложения.
 */
@Component({
  selector: 'app-chat-mobile',
  imports: [
    MobileTabBar, SwipeBackDirective, Sidebar, RoomList, LocationEmpty, RoomView,
    LocationMain, LocationFeatureView, CreateLocation, FindLocation, WorkPage,
    CharacterPanel, DistrictTabView, SettingsScreen, ActionsMenu, DefaultButtonComponent, BackButton,
    DefaultSteps, DefaultInput,
  ],
  templateUrl: './chat-mobile.html',
  styleUrl: './chat-mobile.scss',
})
export class ChatMobile {
  readonly state = inject(ChatShellState);

  private readonly router = inject(Router);
  private readonly messageService = inject(MessageService);
  private readonly currentChatUserService = inject(CurrentChatUserService);
  private readonly districtService = inject(DistrictService);

  readonly districtName = signal<string | null>(null);
  readonly settingsHeaderTitle = computed(() => {
    const page = this.state.settingsPage();
    return page === 'menu' ? null : SETTINGS_PAGE_TITLES[page];
  });
  readonly sidebarLocationTab = signal<'mine' | 'system'>('mine');
  readonly sidebarMyLocationsSearch = signal('');
  readonly sidebarSystemLocationsSearch = signal('');
  readonly createLocationPage = viewChild(CreateLocation);
  readonly createLocationStep = computed(() => this.createLocationPage()?.step() ?? 1);
  readonly sidebarSearchValue = computed(() =>
    this.sidebarLocationTab() === 'mine'
      ? this.sidebarMyLocationsSearch()
      : this.sidebarSystemLocationsSearch(),
  );

  constructor() {
    effect((onCleanup) => {
      const districtId = this.currentChatUserService.selectedDistrictId();
      this.districtName.set(null);
      if (districtId == null) return;

      const subscription = this.districtService.getDistrictById(districtId).subscribe({
        next: (district) => this.districtName.set(district.name),
        error: () => this.districtName.set(null),
      });
      onCleanup(() => subscription.unsubscribe());
    });
  }

  /** Пункты «⋮» на вкладке «Локации»: действия со списком локаций. */
  private readonly locationListItems: RoomMenuItem[] = [
    { id: 'create-location', icon: '➕',  label: 'Создать локацию', run: () => this.state.onCreateLocation() },
    { id: 'find-location', icon: '🔍', label: 'Найти локацию', run: () => this.state.onFindLocation() },
  ];

  /**
   * Иконка шапки: внутри локации — иконка самой локации (мэрия, банк и т.п.),
   * на списке локаций и вкладках — иконка вкладки. Так переход внутрь локации
   * читается как смена контекста, а не как переключение раздела.
   */
  readonly headerIcon = computed<string>(() =>
    this.state.panel() === 'location'
      ? resolveLocationIcon(this.state.selectedLocation())
      : '🗺️',
  );

  /** Активная вкладка таб-бара; экраны локации относятся к вкладке «Локации». */
  readonly activeTab = computed<MobileTab | null>(() => {
    switch (this.state.panel()) {
      case 'empty':
      case 'create':
      case 'find':
      case 'work':
      case 'district':
      case 'profile':
        return this.state.tab();
      case 'location':
        return 'locations';
      case 'settings':
        return null;
    }
  });

  /**
   * Заголовок шапки. Шапки отдельных экранов (LocationHeader) на мобиле
   * скрыты, поэтому название комнаты, локации и раздела берётся здесь.
   */
  readonly headerTitle = computed<string>(() => {
    switch (this.state.panel()) {
      case 'empty': return 'Локации';
      case 'district': return 'Район';
      case 'profile': return 'Персонаж';
      case 'settings': return 'Аккаунт';
      case 'create': return this.createLocationStep() === 1 ? 'Выберите шаблон' : 'Настройте локацию';
      case 'find': return 'Найти локацию';
      case 'work': return 'Работа';
      default: {
        const room = this.state.selectedRoom();
        if (room) return room.name;
        const location = this.state.selectedLocation()?.name;
        if (this.state.locationLoading()) return location ?? '';
        return location ?? 'Локации';
      }
    }
  });

  /**
   * Пункты «⋮» — действия того, что открыто. На списке локаций — создать/найти
   * локацию; в комнате — действия комнаты; в локации — действия фичи.
   * На остальных экранах пунктов нет, и кнопка не рисуется.
   */
  readonly overflowItems = computed<RoomMenuItem[]>(() => {
    const panel = this.state.panel();
    if (panel === 'empty') return this.locationListItems;
    if (panel !== 'location') return [];

    const location = this.state.selectedLocation();
    const room = this.state.selectedRoom();
    if (room && location) return resolveRoomActions(location, room);
    return this.state.featureMenuItems();
  });

  /** Полноэкранный чат: таб-бар скрыт, шапка с «назад». */
  isChatScreen(): boolean {
    return this.state.panel() === 'location' && this.state.selectedRoom() != null;
  }

  /** Показывать кнопку «назад»: вне корневого экрана вкладки она нужна. */
  showBack(): boolean {
    const panel = this.state.panel();
    return panel !== 'empty' && panel !== 'district' && panel !== 'profile';
  }

  get isDistrictInfoSubpage(): boolean {
    return this.router.url.startsWith('/chat/district/info/');
  }

  get districtSettingsStep(): number | null {
    const path = this.router.url.split(/[?#]/, 1)[0];
    if (path === '/chat/district/info/settings') return 2;
    return path.startsWith('/chat/district/info/settings/') ? 3 : null;
  }

  get districtSettingsTitle(): string | null {
    const path = this.router.url.split(/[?#]/, 1)[0];
    return path === '/chat/district/info/settings/roles' ? 'Персонажи района' : null;
  }

  get districtHeaderTitle(): string | null {
    const path = this.router.url.split(/[?#]/, 1)[0];
    if (
      path === '/chat/district' ||
      path === '/chat/district/notifications' ||
      path === '/chat/district/info'
    ) {
      return this.districtName() ?? 'Район';
    }
    return this.districtSettingsTitle;
  }

  onSidebarSearchChange(value: string | number): void {
    const query = String(value);
    if (this.sidebarLocationTab() === 'mine') {
      this.sidebarMyLocationsSearch.set(query);
    } else {
      this.sidebarSystemLocationsSearch.set(query);
    }
  }

  onSettingsBack(): void {
    if (this.state.settingsPage() !== 'menu') {
      this.state.onSettingsPageSelected('menu');
      return;
    }
    this.state.onSettingsBack();
  }

  onDistrictBack(): void {
    const path = this.router.url.split(/[?#]/, 1)[0];
    const target = [
      '/chat/district/info/settings/election',
      '/chat/district/info/settings/recall',
      '/chat/district/info/settings/roles',
    ].includes(path)
      ? '/chat/district/info/settings'
      : '/chat/district/info';
    this.router.navigateByUrl(target);
  }

  /** Настройки приложения — только на вкладке «Персонаж». */
  showSettings(): boolean {
    return this.state.tab() === 'profile';
  }

  onTabSelected(tab: MobileTab): void {
    this.state.onTabSelected(tab);
  }

  onLocationFlowBack(): void {
    if (this.state.panel() === 'create' && this.createLocationPage()?.step() === 2) {
      this.createLocationPage()?.goBack();
      return;
    }
    this.state.onCancelled();
  }

  /**
   * Кнопка «назад» и свайп от левого края. Из комнаты или раздела возвращаемся
   * на экран локации (главное меню и список комнат нарисованы на одном экране).
   */
  onBack(): void {
    if (this.state.panel() === 'settings') {
      this.onSettingsBack();
      return;
    }
    if (this.state.panel() === 'create' || this.state.panel() === 'find') {
      this.onLocationFlowBack();
      return;
    }

    const location = this.state.selectedLocation();
    if (
      (this.isChatScreen() || this.state.selectedFeatureId() != null) &&
      location != null
    ) {
      this.router.navigate(['/chat/location', location.code, 'main']);
      return;
    }
    if (this.state.panel() === 'location') {
      this.state.onBackToTab();
      return;
    }
    this.state.onCancelled();
  }

  onLocationSelected(location: Parameters<ChatShellState['onLocationSelected']>[0]): void {
    this.state.onLocationSelected(location);
  }

  onRoomSelected(room: Parameters<ChatShellState['onRoomSelected']>[0]): void {
    this.state.onRoomSelected(room);
  }

  /**
   * Пункт «Работать» доступен всегда: без лицензии показываем, чего не
   * хватает, и уводим на экран работ — серая кнопка ничего не сообщает.
   */
  onWorkClicked(hasLicence: boolean): void {
    if (!hasLicence) {
      this.messageService.warning(
        'Чтобы работать, нужны паспорт и лицензия на работу. Подайте заявку в разделе «Работы».',
      );
    }
    this.state.onWork();
  }

  onOpenSettings(): void {
    this.state.onOpenSettings();
  }
}