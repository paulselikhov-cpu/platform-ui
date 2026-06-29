import { Component, signal } from '@angular/core';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { LocationView } from '../../../features/location/location-view/location-view';
import { CreateLocation } from '../../../features/location/create-location/create-location';
import { Location } from '../../../services/location.service';

@Component({
  selector: 'app-chat-desktop',
  imports: [Sidebar, LocationEmpty, LocationView, CreateLocation],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop {
  selectedLocation = signal<Location | null>(null);
  showCreateLocation = signal(false);

  onLocationSelected(location: Location) {
    this.selectedLocation.set(location);
    this.showCreateLocation.set(false);
  }

  onCreateLocation() {
    this.showCreateLocation.set(true);
    this.selectedLocation.set(null);
  }

  onLocationCreated(location: Location) {
    // после создания сразу открываем новую локацию
    this.showCreateLocation.set(false);
    this.selectedLocation.set(location);
  }

  onCreateCancelled() {
    this.showCreateLocation.set(false);
  }
}