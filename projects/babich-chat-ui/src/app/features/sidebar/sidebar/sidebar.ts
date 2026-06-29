import { Component, inject, output, OnInit, signal } from '@angular/core';
import { LocationService, Location } from '../../../services/location.service';
import { AuthService } from '../../../services/auth.service';
import { LocationItem } from '../location-item/location-item';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  locationSelected = output<Location>();
  locations = signal<Location[]>([]);
  loading = signal(true);
  selectedId = signal<number | null>(null);

  ngOnInit() {
    this.locationService.getPublicLocations().subscribe({
      next: (locations) => {
        this.locations.set(locations);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  selectLocation(location: Location) {
    this.selectedId.set(location.id);
    this.locationSelected.emit(location);
  }
}