import { Component, inject, Injector, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { RoomView } from '../../../features/location/room-view/room-view';
import { LocationMain } from '../../../features/location/location-main/location-main';
import { LocationFeatureView } from '../../../features/location/location-feature-view/location-feature-view';
import { LocationFeature } from '../../../features/location-feature/location-feature.interface';
import { LocationFeatureStore } from '../../../features/location-feature/location-feature.store';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { FindLocation } from '../../../features/location/find-location/find-location';
import { NavRail, NavRailTab, NavRailAction } from '../../../shared/components/nav-rail/nav-rail';
import { WindowModal } from '../../../shared/components/modals/window-modal/window-modal';
import { SettingsMenu } from '../../../shared/menu/settings-menu/settings-menu';
import { CharacterPanel } from '../../../shared/components/character-panel/character-panel';
import { RoomList } from '../../../features/location/room-list/room-list';
import { LocationService } from '../../../services/backend-services/http/location.service';
import { WorkPage } from '../../../features/economy/work-page/work-page';
import { DistrictInfoMenu } from '../../../shared/menu/district-info-menu/district-info-menu';
import { NotificationSettingsMenu } from '../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictSettingsMenu } from '../../../shared/menu/district-settings-menu/district-settings-menu';
import { ActionsMenu } from '../../../shared/components/actions-menu/actions-menu';
import { RoomMenuItem } from '../../../shared/components/actions-menu/room-menu-item.interface';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';

type RightPanel = 'empty' | 'location' | 'create' | 'find' | 'work';
type SidebarMode = 'locations' | 'rooms';

@Component({
  selector: 'app-chat-desktop',
  imports: [
    Sidebar, LocationEmpty, RoomView, LocationMain, LocationFeatureView, CreateLocation, FindLocation,
    NavRail, CharacterPanel, RoomList, SettingsMenu, WorkPage, DistrictInfoMenu, NotificationSettingsMenu, DistrictSettingsMenu,
    WindowModal, ActionsMenu
  ],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop implements OnInit, OnDestroy {

  private readonly locationService = inject(LocationService);
  private readonly currentChatUserService = inject(CurrentChatUserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  /** Фича переживает пересоздание ChatDesktop (переходы между комнатами). */
  private readonly featureStore = inject(LocationFeatureStore);

  // toObservable требует инъекшн-контекст → создаётся в field initializer, не в ngOnInit
  private readonly character$ = toObservable(this.currentChatUserService.currentChatUser);

  selectedLocation = signal<ILocation | null>(null);
  selectedRoom = signal<IRoom | null>(null);
  /** id активного раздела фичи локации (роут `.../feature/:featureId`); null — не в разделе. */
  selectedFeatureId = signal<string | null>(null);
  /** Фича текущей локации (создаётся здесь — состояние живёт, пока открыта локация). */
  locationFeature = signal<LocationFeature | null>(null);
  panel = signal<RightPanel>('empty');
  sidebarMode = signal<SidebarMode>('locations');
  rooms = signal<IRoom[]>([]);
  activeModal = signal<NavRailTab | null>(null);

  /**
   * Пункты меню «⚡ Действия» фичи текущей локации — рисуются в шапке списка
   * комнат (сайдбар), а не в шапке панели: действия относятся к локации в целом,
   * поэтому доступны из любого её экрана, включая список комнат.
   */
  readonly featureMenuItems = computed<RoomMenuItem[]>(
    () => this.locationFeature()?.menuItems ?? [],
  );

  /**
   * Активна ли кнопка «Главная» в списке комнат — то же главное меню локации
   * (`location/:id/main`), когда не выбраны ни комната, ни раздел.
   */
  readonly activeHome = computed(
    () => this.panel() === 'location' && !this.selectedRoom() && !this.selectedFeatureId(),
  );

  /** id персонажа, для которого загружена текущая локация (чтобы не перезагружать без нужды). */
  private loadedCharacterId: number | null = null;
  private routeSub: Subscription | null = null;

  ngOnInit(): void {
    // Стейт из URL + готовность персонажа: combineLatest излучает, когда оба участника излучили,
    // и далее — при любом изменении параметров маршрута или персонажа.
    this.routeSub = combineLatest([
      this.route.params,
      this.character$
    ]).subscribe(([params, character]) => this.applyRoute(params, character));
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    // Фичу НЕ освобождаем: переходы между комнатами/разделами пересоздают
    // компонент, а состояние (например авторизация сотрудником мэрии) должно
    // пережить переход. Освобождает её `stopLocationFeature` — при уходе
    // из локации (смена локации, `/chat`, ошибка доступа).
  }

  /** Перевод текущего URL в состояние панели (URL — источник истины). */
  private applyRoute(params: Params, character: IChatUser | null): void {
    const page = (this.route.snapshot.data?.['page'] as RightPanel) ?? 'empty';
    // Локация адресуется code, а не числовым id: code уникален в пределах района,
    // район резолвится на бэке из персонажа.
    const locationCode = params['code'] != null ? String(params['code']) : null;
    const roomId = params['roomId'] != null ? Number(params['roomId']) : null;
    const featureId = params['featureId'] != null ? String(params['featureId']) : null;

    switch (page) {
      case 'create':
        this.panel.set('create');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'find':
        this.panel.set('find');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'work':
        this.panel.set('work');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'location':
        this.openLocation(locationCode, roomId, featureId, character);
        break;
      default: // 'empty'
        this.panel.set('empty');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.selectedFeatureId.set(null);
        this.rooms.set([]);
        this.loadedCharacterId = null;
        this.stopLocationFeature();
    }
  }

  /** Открытие локации по deep-link: проверка доступа + загрузка комнат. */
  private openLocation(
    locationCode: string | null,
    roomId: number | null,
    featureId: string | null,
    character: IChatUser | null,
  ): void {
    if (locationCode == null) {
      this.router.navigate(['/chat']);
      return;
    }
    if (!character) {
      // персонаж ещё не подтянулся — subscribe сработает повторно, когда загрузится
      return;
    }

    const locationChanged =
      this.selectedLocation()?.code !== locationCode || this.loadedCharacterId !== character.id;

    if (locationChanged) {
      this.loadLocation(locationCode, roomId, featureId, character.id);
    } else {
      // та же локация, сменилась только комната/раздел — комнаты уже загружены
      this.applyRoom(roomId);
      this.applyFeature(featureId);
    }
  }

  private loadLocation(
    locationCode: string,
    roomId: number | null,
    featureId: string | null,
    characterId: number,
  ): void {
    this.locationService.getLocationByCode(locationCode, characterId).subscribe({
      next: (location) => {
        this.selectedLocation.set(location);
        this.panel.set('location');
        this.sidebarMode.set('rooms');
        this.loadedCharacterId = characterId;
        this.buildLocationFeature(location, characterId);
        // Комнаты берём по внутреннему id локации — URL адресует локацию code'ом,
        // но дальше вглубь (комнаты, участники) работаем по id.
        this.loadRooms(location.id, roomId);
        this.applyFeature(featureId);
      },
      error: (err: HttpErrorResponse) => {
        this.loadedCharacterId = null;
        this.stopLocationFeature();
        // Текст причины отдаёт бэкенд (`message` из тела 403/404) — продуктовую
        // формулировку («не участник») не хардкодим на фронте, а прокидываем в URL,
        // чтобы она пережила F5. Иконка/заголовок — оформление самой страницы.
        const message = err.error?.message ?? null;
        if (err.status === 404) {
          this.router.navigate(['/chat/error'], { queryParams: { reason: 'not-found', message } });
        } else if (err.status === 403) {
          this.router.navigate(['/chat/error'], { queryParams: { reason: 'forbidden', message } });
        } else {
          this.router.navigate(['/chat']);
        }
      }
    });
  }

  private loadRooms(locationId: number, targetRoomId: number | null): void {
    this.locationService.getRooms(locationId).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.applyRoom(targetRoomId);
      },
      error: () => {
        this.rooms.set([]);
        this.selectedRoom.set(null);
      }
    });
  }

  /** Выбрать комнату из уже загруженного списка (или сбросить). */
  private applyRoom(roomId: number | null): void {
    if (roomId == null) {
      this.selectedRoom.set(null);
      return;
    }
    const room = this.rooms().find((r) => r.id === roomId);
    if (room) {
      this.selectedRoom.set(room);
    } else {
      // некорректный roomId в URL — возвращаемся в главное меню локации
      const locCode = this.selectedLocation()?.code;
      if (locCode != null) this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  /** Выбрать раздел фичи локации (или сбросить). */
  private applyFeature(featureId: string | null): void {
    if (featureId == null) {
      this.selectedFeatureId.set(null);
      return;
    }
    const exists = this.locationFeature()?.screens.some((s) => s.id === featureId) ?? false;
    if (exists) {
      this.selectedFeatureId.set(featureId);
    } else {
      // некорректный featureId в URL — возвращаемся в главное меню локации
      const locCode = this.selectedLocation()?.code;
      if (locCode != null) this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  /**
   * Фича локации — берётся из `LocationFeatureStore`, поэтому её состояние
   * (например `employeeAuthorized` в мэрии) переживает переходы между
   * комнатами: `ChatDesktop` пересоздаётся, а фича остаётся прежней.
   *
   * Важно: здесь НЕ вызываем `stopLocationFeature()` — этот метод вызывается
   * при каждом пересоздании компонента, и предварительный release уничтожил бы
   * кэш до `acquire()`. Смена локации обрабатывается самим `acquire()`:
   * при другом ключе он освобождает прежнюю фичу.
   */
  private buildLocationFeature(location: ILocation, characterId: number): void {
    this.locationFeature.set(this.featureStore.acquire(location, characterId, this.injector));
  }

  /** Отпустить фичу локации (уход из локации / смена локации). */
  private stopLocationFeature(): void {
    this.featureStore.release();
    this.locationFeature.set(null);
  }

  onLocationSelected(location: ILocation): void {
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onCreateLocation(): void {
    this.router.navigate(['/chat/location/create']);
  }

  onFindLocation(): void {
    this.router.navigate(['/chat/location/find']);
  }

  onLocationCreated(location: ILocation): void {
    // навигация на новую локацию → компонент пересоздаётся, сайдбар подгрузит её сам
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onLocationJoined(location: ILocation): void {
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onCancelled(): void {
    this.router.navigate(['/chat']);
  }

  onRoomSelected(room: IRoom): void {
    const locCode = this.selectedLocation()?.code;
    if (locCode != null) {
      this.router.navigate(['/chat/location', locCode, 'room', room.id]);
    }
  }

  /** Кнопка «Главная» в списке комнат — вернуться в главное меню локации. */
  onRoomListHome(): void {
    const locCode = this.selectedLocation()?.code;
    if (locCode != null) {
      this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  onNavTab(tab: NavRailTab) {
    // Кнопка «Главная» — вернуться в меню выбора локаций (сброс состояния)
    if (tab === 'home') {
      this.router.navigate(['/chat']);
      return;
    }
    // Закрываем модалку, если кликнули по той же вкладке
    if (this.activeModal() === tab) {
      this.activeModal.set(null);
      return;
    }

    // Открываем соответствующую модалку
    switch (tab) {
      case 'user-settings':
        this.activeModal.set('user-settings');
        break;
      case 'info':
        this.activeModal.set('info');
        break;
      case 'notification':
        this.activeModal.set('notification');
        break;
      case 'district-settings':
        this.activeModal.set('district-settings');
        break;
      default:
        this.activeModal.set(null);
        break;
    }
  }

  closeModal() {
    this.activeModal.set(null);
  }

  onWork(): void {
    this.router.navigate(['/chat/work']);
  }

  onWorkCancelled(): void {
    this.router.navigate(['/chat']);
  }

  onNavAction(action: NavRailAction) {
    switch (action) {
      case 'create':
        this.onCreateLocation();
        break;
      case 'find':
        this.onFindLocation();
        break;
      case 'work':
        this.onWork();
        break;
    }
  }
}