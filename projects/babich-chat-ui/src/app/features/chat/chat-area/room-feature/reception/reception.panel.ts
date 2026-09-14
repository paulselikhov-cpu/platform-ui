import { Component, computed, input, signal } from '@angular/core';
import { ReceptionMenu } from './reception-menu/reception-menu';
import { WindowModal } from '../../../../../shared/components/modals/window-modal/window-modal';
import { EmployeeApplicationsMenu } from '../../../../../shared/menu/employee-applications-menu/employee-applications-menu';
import { RoomFeature } from '../room-feature.interface';
import { ReceptionFeature } from './reception.feature';

/** Контент-панель фичи «Приёмная» + индикатор режима и модалка «Гражданские заявки». */
@Component({
  selector: 'app-reception-panel',
  imports: [ReceptionMenu, WindowModal, EmployeeApplicationsMenu],
  templateUrl: './reception.panel.html',
  styleUrl: './reception.panel.scss',
})
export class ReceptionPanel {
  readonly feature = input.required<RoomFeature>();
  readonly receptionFeature = computed(() => this.feature() as ReceptionFeature);
  readonly employeeApplicationsModalOpen = signal(false);
}
