import { Component, inject, signal, ViewChild } from '@angular/core';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { LocationView } from '../../../features/location/location-view/location-view';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { ILocation, IRoom } from '../../../models/location/location.interface';
import { FindLocation } from '../../../features/location/find-location/find-location';
import { NavRail, NavRailTab, NavRailAction } from '../../../shared/components/nav-rail/nav-rail';
import { SettingsModal } from '../../../shared/components/modals/settings-modal/settings-modal';
import { CharacterPanel } from '../../../shared/components/character-panel/character-panel';
import { RoomList } from '../../../features/location/room-list/room-list';
import { LocationService } from '../../../services/backend-services/http/location.service';
import { WorkPage } from '../../../features/economy/work-page/work-page';
import { DistrictInfoModal } from '../../../shared/components/modals/district-info-modal/district-info-modal';
import { NotificationInfoModal } from '../../../shared/components/modals/notification-info-modal/notification-info-modal';
import { ApplicationsModal } from '../../../shared/components/modals/applications-modal/applications-modal';

type RightPanel = 'empty' | 'location' | 'create' | 'find' | 'work';
type SidebarMode = 'locations' | 'rooms';
type ModalType = 'settings' | 'info' | 'notification' | 'applications' | null;

@Component({
  selector: 'app-chat-desktop',
  imports: [
    Sidebar, LocationEmpty, LocationView, CreateLocation, FindLocation,
    NavRail, CharacterPanel, RoomList, SettingsModal, WorkPage, DistrictInfoModal, NotificationInfoModal, ApplicationsModal
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
  activeModal = signal<ModalType>(null);

  onLocationSelected(location: ILocation) {
    this.selectedLocation.set(location);
    this.selectedRoom.set(null);
    this.panel.set('location');
    this.sidebarMode.set('rooms');
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

  onBackToLocations() {
    this.sidebarMode.set('locations');
    this.selectedRoom.set(null);
  }

  onRoomSelected(room: IRoom) {
    this.selectedRoom.set(room);
  }

  onNavTab(tab: NavRailTab) {
    // Закрываем модалку, если кликнули по той же вкладке
    if (this.activeModal() === tab) {
      this.activeModal.set(null);
      return;
    }

    // Открываем соответствующую модалку
    switch (tab) {
      case 'settings':
        this.activeModal.set('settings');
        break;
      case 'info':
        this.activeModal.set('info');
        break;
      case 'notification':
        this.activeModal.set('notification');
        break;
      case 'applications':
        this.activeModal.set('applications');
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
      next: (rooms) => this.rooms.set(rooms),
      error: () => this.rooms.set([])
    });
  }
}