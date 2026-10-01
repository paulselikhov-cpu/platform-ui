import { Component, computed, input } from '@angular/core';
import { LocationFeature } from '../../../location-feature.interface';
import { CityHallFeature } from '../../city-hall.feature';
import { GovernorsAdminMenu } from './governors-admin-menu/governors-admin-menu';
/**
 * Режим «Панель управления районом» (Кабинет губернатора).
 * Содержимое видно только текущему губернатору — остальным заглушка.
 */
@Component({
  selector: 'app-governors-office-view',
  imports: [GovernorsAdminMenu],
  templateUrl: './governors-office.view.html',
  styleUrl: './governors-office.view.scss',
})
export class GovernorsOfficeView {
  readonly feature = input.required<LocationFeature>();
  readonly f = computed(() => this.feature() as CityHallFeature);
}