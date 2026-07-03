import { Component, signal, ViewChild } from '@angular/core';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { LocationView } from '../../../features/location/location-view/location-view';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { ILocation } from '../../../models/location/location.interface';
import { FindLocation } from '../../../features/location/find-location/find-location';

type RightPanel = 'empty' | 'location' | 'create' | 'find';

@Component({
  selector: 'app-chat-desktop',
  imports: [Sidebar, LocationEmpty, LocationView, CreateLocation, FindLocation],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop {
  @ViewChild(Sidebar) sidebarRef!: Sidebar;

  selectedLocation = signal<ILocation | null>(null);
  panel = signal<RightPanel>('empty');

  onLocationSelected(location: ILocation) {
    this.selectedLocation.set(location);
    this.panel.set('location');
  }

  onCreateLocation() {
    this.panel.set('create');
    this.selectedLocation.set(null);
  }

  onFindLocation() {
    this.panel.set('find');
    this.selectedLocation.set(null);
  }

  onLocationCreated(location: ILocation) {
    this.panel.set('location');
    this.selectedLocation.set(location);
    this.sidebarRef?.refresh(); // обновляем список
  }

  onLocationJoined(location: ILocation) {
    this.panel.set('location');
    this.selectedLocation.set(location);
    this.sidebarRef?.refresh(); // обновляем список
  }

  onCancelled() {
    this.panel.set('empty');
  }
}