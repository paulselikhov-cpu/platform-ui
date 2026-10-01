import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ILocation } from '../../../models/location/location.interface';
import { LocationType } from '../../../models/location/location-type.enum';
import { LocationFeature, LocationFeatureScreen } from '../../location-feature/location-feature.interface';
import { LocationHeader } from '../../../shared/components/location-header/location-header';

/** Иконка локации по её типу (для шапки главного меню). */
const LOCATION_ICONS: Record<LocationType, string> = {
  [LocationType.CITY_HALL]: '🏛️',
  [LocationType.LENIN_SQUARE]: '🗳️',
  [LocationType.POLICE_STATION]: '🚓',
  [LocationType.PRISON]: '🔒',
  [LocationType.BANK]: '🏦',
  [LocationType.WAREHOUSE]: '📦',
  [LocationType.GENERAL_MARKET]: '🏬',
  [LocationType.REAL_ESTATE_MARKET]: '🏘️',
  [LocationType.BUSINESS]: '🏪',
  [LocationType.HOME]: '🏠',
};

/**
 * Главное меню локации (роут `location/:locationId/main`): грид-сетка разделов
 * фичи локации. Каждая кнопка ведёт на экран раздела
 * (`location/:locationId/feature/:screenId`). Сама локация (шапка, действия)
 * берётся из фичи — компонент ничего про конкретные локации не знает.
 */
@Component({
  selector: 'app-location-main',
  imports: [LocationHeader],
  templateUrl: './location-main.html',
  styleUrl: './location-main.scss',
})
export class LocationMain {
  readonly location = input.required<ILocation>();
  readonly feature = input<LocationFeature | null>(null);

  private readonly router = inject(Router);

  readonly icon = computed(() => {
    const type = this.location().type;
    return type != null ? LOCATION_ICONS[type] ?? '📍' : '📍';
  });

  /** Видимые разделы локации (кнопки грида). */
  readonly screens = computed<LocationFeatureScreen[]>(() =>
    (this.feature()?.screens ?? []).filter((s) => s.visible?.() ?? true),
  );

  openScreen(screen: LocationFeatureScreen): void {
    this.router.navigate(['/chat/location', this.location().id, 'feature', screen.id]);
  }
}
