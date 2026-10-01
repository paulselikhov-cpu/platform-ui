import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ILocation } from '../../../models/location/location.interface';
import { LocationType, SystemLocationCode } from '../../../models/location/location-type.enum';
import { LocationFeature, LocationFeatureScreen } from '../../location-feature/location-feature.interface';
import { LocationHeader } from '../../../shared/components/location-header/location-header';

/**
 * Иконка локации по её code (для шапки главного меню).
 * Ключ — код, а не LocationType: тип различает лишь SYSTEM/DEFAULT/BUSINESS.
 */
const LOCATION_ICONS: Record<string, string> = {
  [SystemLocationCode.CITY_HALL]: '🏛️',
  [SystemLocationCode.LENIN_SQUARE]: '🗳️',
  [SystemLocationCode.POLICE_STATION]: '🚓',
  [SystemLocationCode.PRISON]: '🔒',
  [SystemLocationCode.BANK]: '🏦',
  [SystemLocationCode.WAREHOUSE]: '📦',
  [SystemLocationCode.GENERAL_MARKET]: '🏬',
  [SystemLocationCode.REAL_ESTATE_MARKET]: '🏘️',
  [LocationType.BUSINESS]: '🏪',
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
    // Иконка по code: у системных локаций он и определяет вид,
    // у пользовательских — по типу (BUSINESS → заведение), иначе 📍.
    const code = this.location().code;
    if (code && LOCATION_ICONS[code]) return LOCATION_ICONS[code];
    return this.location().type === LocationType.BUSINESS ? LOCATION_ICONS[LocationType.BUSINESS] : '📍';
  });

  /** Видимые разделы локации (кнопки грида). */
  readonly screens = computed<LocationFeatureScreen[]>(() =>
    (this.feature()?.screens ?? []).filter((s) => s.visible?.() ?? true),
  );

  openScreen(screen: LocationFeatureScreen): void {
    this.router.navigate(['/chat/location', this.location().code, 'feature', screen.id]);
  }
}
