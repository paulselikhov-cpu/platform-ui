import { Component, computed, input } from '@angular/core';
import { ReceptionMenu } from '../../components/reception-menu/reception-menu';
import { RoomFeature } from '../room-feature.interface';
import { ReceptionFeature } from '../features/reception.feature';

/** Контент-панель фичи «Приёмная» + индикатор режима сотрудника мэрии. */
@Component({
  selector: 'app-reception-panel',
  imports: [ReceptionMenu],
  template: `
    @if (f().employeeAuthorized()) {
      <div class="reception-staff-badge">🪪 Режим сотрудника мэрии</div>
    }
    <app-reception-menu />
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
}
