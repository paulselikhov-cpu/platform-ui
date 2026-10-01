import { Component, computed, input } from '@angular/core';
import { EmployeeApplicationsMenu } from '../../../../../shared/menu/employee-applications-menu/employee-applications-menu';
import { LocationFeature } from '../../../location-feature.interface';
import { CityHallFeature } from '../../city-hall.feature';

/**
 * Режим «Личный кабинет сотрудника» (приёмная): модерация гражданских
 * заявок. Кнопка режима видна только авторизованному сотруднику мэрии.
 * Выход из режима — здесь же: в не-чат режимах шапка с меню «⚡ Действия»
 * не отображается, действие выхода должно быть доступно.
 */
@Component({
  selector: 'app-employee-office-view',
  imports: [EmployeeApplicationsMenu],
  templateUrl: './employee-office.view.html',
  styleUrl: './employee-office.view.scss',
})
export class EmployeeOfficeView {
  readonly feature = input.required<LocationFeature>();
  readonly f = computed(() => this.feature() as CityHallFeature);
}
