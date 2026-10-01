import { Component, computed, inject, input } from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { Router } from '@angular/router';
import { ILocation } from '../../../models/location/location.interface';
import { LocationFeature } from '../../location-feature/location-feature.interface';
import { LocationHeader } from '../../../shared/components/location-header/location-header';

/**
 * Экран раздела фичи локации (роут `location/:locationId/feature/:screenId`).
 * Рендерит компонент раздела через ngComponentOutlet, передавая ему фичу как
 * input `feature`; в шапке — кнопка «назад» в главное меню локации и меню
 * «⚡ Действия» фичи.
 */
@Component({
  selector: 'app-location-feature-view',
  imports: [NgComponentOutlet, LocationHeader],
  templateUrl: './location-feature-view.html',
  styleUrl: './location-feature-view.scss',
})
export class LocationFeatureView {
  readonly location = input.required<ILocation>();
  readonly feature = input.required<LocationFeature>();
  readonly screenId = input.required<string>();

  private readonly router = inject(Router);

  /** Раздел фичи по id из URL (может быть null при некорректной ссылке). */
  readonly screen = computed(
    () => this.feature().screens.find((s) => s.id === this.screenId()) ?? null,
  );

  backToMain(): void {
    this.router.navigate(['/chat/location', this.location().code, 'main']);
  }
}
