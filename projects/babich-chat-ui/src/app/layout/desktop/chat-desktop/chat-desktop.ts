import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { RoomView } from '../../../features/location/room-view/room-view';
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
import { BackButton } from '../../../shared/components/back-button/back-button';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { IChatUser } from '../../../models/chatUser/chatUser.interface';

type RightPanel = 'empty' | 'location' | 'create' | 'find' | 'work';
type SidebarMode = 'locations' | 'rooms';

@Component({
  selector: 'app-chat-desktop',
  imports: [
    Sidebar, LocationEmpty, RoomView, CreateLocation, FindLocation,
    NavRail, CharacterPanel, RoomList, SettingsMenu, WorkPage, DistrictInfoMenu, NotificationSettingsMenu, DistrictSettingsMenu,
    WindowModal, BackButton
  ],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop implements OnInit, OnDestroy {

  private readonly locationService = inject(LocationService);
  private readonly currentChatUserService = inject(CurrentChatUserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  // toObservable требует инъекшн-контекст → создаётся в field initializer, не в ngOnInit
  private readonly character$ = toObservable(this.currentChatUserService.currentChatUser);

  selectedLocation = signal<ILocation | null>(null);
  selectedRoom = signal<IRoom | null>(null);
  panel = signal<RightPanel>('empty');
  sidebarMode = signal<SidebarMode>('locations');
  rooms = signal<IRoom[]>([]);
  activeModal = signal<NavRailTab | null>(null);

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
  }

  /** Перевод текущего URL в состояние панели (URL — источник истины). */
  private applyRoute(params: Params, character: IChatUser | null): void {
    const page = (this.route.snapshot.data?.['page'] as RightPanel) ?? 'empty';
    const locationId = params['locationId'] != null ? Number(params['locationId']) : null;
    const roomId = params['roomId'] != null ? Number(params['roomId']) : null;

    switch (page) {
      case 'create':
        this.panel.set('create');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        break;
      case 'find':
        this.panel.set('find');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        break;
      case 'work':
        this.panel.set('work');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        break;
      case 'location':
        this.openLocation(locationId, roomId, character);
        break;
      default: // 'empty'
        this.panel.set('empty');
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.rooms.set([]);
        this.loadedCharacterId = null;
    }
  }

  /** Открытие локации по deep-link: проверка доступа + загрузка комнат. */
  private openLocation(locationId: number | null, roomId: number | null, character: IChatUser | null): void {
    if (locationId == null) {
      this.router.navigate(['/chat']);
      return;
    }
    if (!character) {
      // персонаж ещё не подтянулся — subscribe сработает повторно, когда загрузится
      return;
    }

    const locationChanged =
      this.selectedLocation()?.id !== locationId || this.loadedCharacterId !== character.id;

    if (locationChanged) {
      this.loadLocation(locationId, roomId, character.id);
    } else {
      // та же локация, сменилась только комната — комнаты уже загружены
      this.applyRoom(roomId);
    }
  }

  private loadLocation(locationId: number, roomId: number | null, characterId: number): void {
    this.locationService.getLocation(locationId, characterId).subscribe({
      next: (location) => {
        this.selectedLocation.set(location);
        this.panel.set('location');
        this.sidebarMode.set('rooms');
        this.loadedCharacterId = characterId;
        this.loadRooms(locationId, roomId);
      },
      error: (err: HttpErrorResponse) => {
        this.loadedCharacterId = null;
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
      // некорректный roomId в URL — убираем сегмент комнаты
      const locId = this.selectedLocation()?.id;
      if (locId != null) this.router.navigate(['/chat/location', locId]);
    }
  }

  onLocationSelected(location: ILocation): void {
    this.router.navigate(['/chat/location', location.id]);
  }

  onCreateLocation(): void {
    this.router.navigate(['/chat/location/create']);
  }

  onFindLocation(): void {
    this.router.navigate(['/chat/location/find']);
  }

  onLocationCreated(location: ILocation): void {
    // навигация на новую локацию → компонент пересоздаётся, сайдбар подгрузит её сам
    this.router.navigate(['/chat/location', location.id]);
  }

  onLocationJoined(location: ILocation): void {
    this.router.navigate(['/chat/location', location.id]);
  }

  onCancelled(): void {
    this.router.navigate(['/chat']);
  }

  onRoomSelected(room: IRoom): void {
    const locId = this.selectedLocation()?.id;
    if (locId != null) {
      this.router.navigate(['/chat/location', locId, 'room', room.id]);
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

  onRoomListBack(): void {
    this.sidebarMode.set('locations');
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