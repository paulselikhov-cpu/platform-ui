import { Component, inject, output, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LocationService } from '../../../services/location.service';
import { AuthService } from '../../../core/services/auth.service';
import { ILocation } from '../../../models/location/location.interface';

@Component({
  selector: 'app-find-location',
  imports: [FormsModule],
  templateUrl: './find-location.html',
  styleUrl: './find-location.scss'
})
export class FindLocation {
  private locationService = inject(LocationService);
  private authService = inject(AuthService);

  locationJoined = output<ILocation>();
  cancelled = output<void>();

  // режим: search = поиск публичных, private = вход по коду
  mode = signal<'search' | 'private'>('search');
  // поиск публичных
  searchQuery = signal('');
  allPublicLocations = signal<ILocation[]>([]);
  publicLoading = signal(false);
  // фильтрованный список по поисковому запросу
  filteredLocations = signal<ILocation[]>([]);
  // вход по коду
  inviteCode = signal('');
  privateLoading = signal(false);
  privateError = signal('');
  // статусы вступления
  joiningId = signal<number | null>(null);
  joinError = signal('');

  constructor() {
    this.loadPublicLocations();
  }

  loadPublicLocations() {
    this.publicLoading.set(true);
    this.locationService.getPublicLocations().subscribe({
      next: (locations) => {
        this.allPublicLocations.set(locations);
        this.filteredLocations.set(locations);
        this.publicLoading.set(false);
      },
      error: () => this.publicLoading.set(false)
    });
  }

  joinPublic(location: ILocation) {
    const user = this.authService.currentUser();
    if (!user) return;

    this.joiningId.set(location.id);
    this.joinError.set('');

    this.locationService.joinLocation(location.inviteCode, user.userId).subscribe({
      next: () => {
        this.joiningId.set(null);
        this.locationJoined.emit(location);
      },
      error: (err) => {
        this.joiningId.set(null);
        this.joinError.set(err.error?.message || 'Ошибка вступления');
      }
    });
  }

  joinByCode() {
    const code = this.inviteCode().trim();
    if (!code) return;

    const user = this.authService.currentUser();
    if (!user) return;

    this.privateLoading.set(true);
    this.privateError.set('');

    this.locationService.joinLocation(code, user.userId).subscribe({
      next: (member: any) => {
        this.privateLoading.set(false);
        // после вступления загружаем локацию по inviteCode
        // используем getMyLocations и берём последнюю добавленную
        this.locationService.getMyLocations(user.userId).subscribe({
          next: (locations) => {
            const joined = locations.find(l => l.inviteCode === code);
            if (joined) this.locationJoined.emit(joined);
          }
        });
      },
      error: (err) => {
        this.privateLoading.set(false);
        this.privateError.set(err.error?.message || 'Локация не найдена');
      }
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    const q = query.toLowerCase().trim();
    if (!q) {
      this.filteredLocations.set(this.allPublicLocations());
      return;
    }
    this.filteredLocations.set(
      this.allPublicLocations().filter(loc =>
        loc.name.toLowerCase().includes(q) ||
        loc.description?.toLowerCase().includes(q)
      )
    );
  }
}