import { Component, signal } from '@angular/core';
import { Sidebar } from '../../../features/sidebar/sidebar/sidebar';
import { LocationEmpty } from '../../../features/location/location-empty/location-empty';
import { LocationView } from '../../../features/location/location-view/location-view';
import { Location } from '../../../services/location.service';

@Component({
  selector: 'app-chat-desktop',
  imports: [Sidebar, LocationEmpty, LocationView],
  templateUrl: './chat-desktop.html',
  styleUrl: './chat-desktop.scss'
})
export class ChatDesktop {
  selectedLocation = signal<Location | null>(null);

  onLocationSelected(location: Location) {
    this.selectedLocation.set(location);
  }
}