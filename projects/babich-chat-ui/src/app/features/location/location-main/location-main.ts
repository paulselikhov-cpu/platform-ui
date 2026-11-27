import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { ILocation } from '../../../models/location/location.interface';
import { LocationFeature, LocationFeatureScreen } from '../../location-feature/location-feature.interface';
import { LocationHeader } from '../../../shared/components/location-header/location-header';
import { resolveLocationIcon } from '../location-icons';
import { DefaultButtonComponent } from '../../../shared/components/buttons/default-button/default-button';
import { DefaultList } from '../../../shared/components/default-list/default-list';

/**
 * Главное меню локации (роут `location/:locationId/main`): грид-сетка разделов
 * фичи локации. Каждая кнопка ведёт на экран раздела
 * (`location/:locationId/feature/:screenId`). Сама локация (шапка, действия)
 * берётся из фичи — компонент ничего про конкретные локации не знает.
 */
@Component({
  selector: 'app-location-main',
  imports: [LocationHeader, DefaultButtonComponent, DefaultList],
  templateUrl: './location-main.html',
  styleUrl: './location-main.scss',
})
export class LocationMain {
  readonly location = input.required<ILocation>();
  readonly feature = input<LocationFeature | null>(null);

  private readonly router = inject(Router);

  // Иконка локации для шапки; общий источник с мобильной шапкой —
  // иначе одна и та же локация выглядела бы по-разному в разных экранах.
  readonly icon = computed(() => resolveLocationIcon(this.location()));

  /** Видимые разделы локации (кнопки грида). */
  readonly screens = computed<LocationFeatureScreen[]>(() =>
    (this.feature()?.screens ?? []).filter((s) => s.visible?.() ?? true),
  );

  openScreen(screen: LocationFeatureScreen): void {
    this.router.navigate(['/chat/location', this.location().code, 'feature', screen.id]);
  }
}
