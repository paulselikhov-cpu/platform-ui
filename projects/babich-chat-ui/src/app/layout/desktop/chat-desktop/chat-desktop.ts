import { Component, inject, signal, ViewChild } from '@angular/core';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { LocationView } from '../../../features/location/location-view/location-view';
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
import { NotificationSettingsMenu } from '../../../shared/menu/notification-settings-menu/notification-settings-menu';
import { DistrictSettingsMenu } from '../../../shared/menu/district-settings-menu/district-settings-menu';

type RightPanel = 'empty' | 'location' | 'create' | 'find' | 'work';
type SidebarMode = 'locations' | 'rooms';

const STORAGE_KEY_LAST_LOCATION = 'babich_last_location_id';
const STORAGE_KEY_ROOMS = 'babich_last_rooms';

@Component({
  selector: 'app-chat-desktop',
  imports: [
    Sidebar, LocationEmpty, LocationView, CreateLocation, FindLocation,
    NavRail, CharacterPanel, RoomList, SettingsMenu, WorkPage, DistrictInfoMenu, NotificationSettingsMenu, DistrictSettingsMenu,
    WindowModal
  ],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop {
  @ViewChild(Sidebar) sidebarRef!: Sidebar;

  private readonly locationService = inject(LocationService);

  selectedLocation = signal<ILocation | null>(null);
  selectedRoom = signal<IRoom | null>(null);
  panel = signal<RightPanel>('empty');
  sidebarMode = signal<SidebarMode>('locations');
  rooms = signal<IRoom[]>([]);
  activeModal = signal<NavRailTab | null>(null);

  onLocationSelected(location: ILocation) {
    this.selectedLocation.set(location);
    this.selectedRoom.set(null);
    this.panel.set('location');
    this.sidebarMode.set('rooms');
    this.persistLastLocation(location.id);
    this.loadRooms(location.id);
  }

  onCreateLocation() {
    this.panel.set('create');
    this.selectedLocation.set(null);
    this.sidebarMode.set('locations');
  }

  onFindLocation() {
    this.panel.set('find');
    this.selectedLocation.set(null);
    this.sidebarMode.set('locations');
  }

  onLocationCreated(location: ILocation) {
    this.panel.set('location');
    this.selectedLocation.set(location);
    this.sidebarMode.set('rooms');
    this.loadRooms(location.id);
    this.sidebarRef?.refresh();
    this.sidebarRef?.refresh(() => {
      this.sidebarRef?.setSelected(location.id);
    });
  }

  onLocationJoined(location: ILocation) {
    this.panel.set('location');
    this.selectedLocation.set(location);
    this.sidebarMode.set('rooms');
    this.loadRooms(location.id);
    this.sidebarRef?.refresh();
    this.sidebarRef?.refresh(() => {
      this.sidebarRef?.setSelected(location.id);
    });
  }

  onCancelled() {
    this.panel.set('empty');
    this.sidebarMode.set('locations');
  }

  onRoomSelected(room: IRoom) {
    this.selectedRoom.set(room);
    this.persistSelectedRoom(room.id);
  }

  onNavTab(tab: NavRailTab) {
    // Кнопка «Главная» — вернуться в меню выбора локаций (сброс состояния)
    if (tab === 'home') {
      this.selectedLocation.set(null);
      this.selectedRoom.set(null);
      this.rooms.set([]);
      this.panel.set('empty');
      this.sidebarMode.set('locations');
      localStorage.removeItem(STORAGE_KEY_LAST_LOCATION);
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

  onWork() {
    this.panel.set('work');
    this.selectedLocation.set(null);
    this.sidebarMode.set('locations');
  }

  onWorkCancelled() {
    this.panel.set('empty');
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

  private loadRooms(locationId: number) {
    this.locationService.getRooms(locationId).subscribe({
      next: (rooms) => {
        this.rooms.set(rooms);
        this.restoreSelectedRoom(locationId, rooms);
      },
      error: () => this.rooms.set([])
    });
  }

  // ── сохранение/восстановление последней локации и комнаты (переживает F5) ──

  private persistLastLocation(locationId: number): void {
    localStorage.setItem(STORAGE_KEY_LAST_LOCATION, locationId.toString());
  }

  /** Сохранить выбранную комнату на карту (locationId -> roomId). */
  private persistSelectedRoom(roomId: number): void {
    const locationId = this.selectedLocation()?.id;
    if (locationId == null) return;
    const map = this.readRoomMap();
    map[locationId] = roomId;
    localStorage.setItem(STORAGE_KEY_ROOMS, JSON.stringify(map));
  }

  /** После загрузки комнат локации — вернуть сохранённую комнату этой локации. */
  private restoreSelectedRoom(locationId: number, rooms: IRoom[]): void {
    const roomId = this.readRoomMap()[locationId];
    if (roomId == null || rooms.length === 0) return;
    const room = rooms.find((r) => r.id === roomId);
    if (room) {
      this.selectedRoom.set(room);
    }
  }

  private readRoomMap(): Record<number, number> {
    const raw = localStorage.getItem(STORAGE_KEY_ROOMS);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  }
}