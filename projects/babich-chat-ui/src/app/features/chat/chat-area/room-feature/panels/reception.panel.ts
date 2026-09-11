import { Component, computed, input, signal } from '@angular/core';
import { ReceptionMenu } from '../../components/reception-menu/reception-menu';
import { CivilApplicationsModal } from '../../../../../shared/components/modals/civil-applications-modal/civil-applications-modal';
import { RoomFeature } from '../room-feature.interface';
import { ReceptionFeature } from '../features/reception.feature';

/** Контент-панель фичи «Приёмная» + индикатор режима и модалка «Гражданские заявки». */
@Component({
  selector: 'app-reception-panel',
  imports: [ReceptionMenu, CivilApplicationsModal],
  template: `
    @if (f().employeeAuthorized()) {
      <div class="reception-staff-badge">🪪 Режим сотрудника мэрии</div>
      <button class="btn-primary" (click)="civilApplicationsModalOpen.set(true)">
        Гражданские заявки
      </button>
    }

    @if (civilApplicationsModalOpen()) {
      <app-civil-applications-modal
        (closeModal)="civilApplicationsModalOpen.set(false)"
      />
    }

    <!-- житель подаёт заявки, сотрудник — модераторит их (не подаёт) -->
    @if (!f().employeeAuthorized()) {
      <app-reception-menu />
    }
  `,
  styles: [
    `
      .reception-staff-badge {
        display: inline-block;
        font-family: 'Courier New', monospace;
        font-size: 11px;
        padding: 2px 8px;
        border: 1px solid #7a6a5a;
        background: rgba(122, 106, 90, 0.2);
        color: var(--color-text-primary);
        border-radius: 3px;
      }
    `,
  ],
})
export class ReceptionPanel {
  readonly feature = input.required<RoomFeature>();
  readonly f = computed(() => this.feature() as ReceptionFeature);
  readonly civilApplicationsModalOpen = signal(false);
}
