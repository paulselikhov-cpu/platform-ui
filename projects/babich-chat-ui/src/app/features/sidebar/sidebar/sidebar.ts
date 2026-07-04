import { Component, inject, output, OnInit, signal } from '@angular/core';
import { LocationService } from '../../../services/location.service';
import { LocationItem } from '../location-item/location-item';
import { AuthService } from '../../../core/services/auth.service';
import { ILocation } from '../../../models/location/location.interface';

@Component({
  selector: 'app-sidebar',
  imports: [LocationItem],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss'
})
export class Sidebar implements OnInit {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  locationSelected = output<ILocation>();
  createLocation = output<void>();
  findLocation = output<void>(); // output для кнопки поиска

  locations = signal<ILocation[]>([]);
  loading = signal(true);
  selectedId = signal<number | null>(null);

  ngOnInit() {
    const user = this.authService.currentUser();
    if (!user) return;

    // загружаем только МОИ локации — где я участник
    this.locationService.getMyLocations(user.userId).subscribe({
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

  // обновить список после вступления в новую локацию
  refresh(callback?: () => void) {
    const user = this.authService.currentUser();
    if (!user) return;

    this.locationService.getMyLocations(user.userId).subscribe({
      next: (locations) => {
        this.locations.set(locations);
        callback?.();
      }
    });
  }

  setSelected(locationId: number) {
    this.selectedId.set(locationId);
  }
}