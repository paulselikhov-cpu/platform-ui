import { Component, computed, input } from '@angular/core';
import { GovernorsAdminMenu } from '../../components/governors-admin-menu/governors-admin-menu';
import { RoomFeature } from '../room-feature.interface';
import { GovernorsOfficeFeature } from './governors-office.feature';

/** Контент-панель фичи «Кабинет губернатора» — видна только губернатору. */
@Component({
  selector: 'app-governors-office-panel',
  imports: [GovernorsAdminMenu],
  template: `
    @if (f().isCurrentUserGovernor()) {
      <app-governors-admin-menu />
    }
  `,
})
export class GovernorsOfficePanel {
  readonly feature = input.required<RoomFeature>();
  readonly f = computed(() => this.feature() as GovernorsOfficeFeature);
}
