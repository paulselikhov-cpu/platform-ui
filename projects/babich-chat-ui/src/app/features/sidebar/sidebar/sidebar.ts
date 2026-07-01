import { Component, inject, output, OnInit, signal } from '@angular/core';
import { LocationService } from '../../../services/location.service';
import { LocationItem } from '../location-item/location-item';
import { ILocation } from '../../../models/location/location.interface';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private locationService = inject(LocationService);

  locationSelected = output<ILocation>();
  createLocation = output<void>(); // ← новый output

  locations = signal<ILocation[]>([]);
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

  selectLocation(location: ILocation) {
    this.selectedId.set(location.id);
    this.locationSelected.emit(location);
  }
}