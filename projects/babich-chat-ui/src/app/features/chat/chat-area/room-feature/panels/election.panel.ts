import { Component, computed, input } from '@angular/core';
import { ElectionTable } from '../../../../../shared/components/election-table/election-table';
import { RoomFeature } from '../room-feature.interface';
import { LeninSquareFeature } from '../features/lenin-square.feature';

/** Контент-панель фичи «Площадь Ленина» — мини-таблица выборов. */
@Component({
  selector: 'app-election-panel',
  imports: [ElectionTable],
  template: `
    <app-election-table
      [electionOverview]="f().electionOverview()"
      (refreshElection)="f().refreshElection()"
    />
  `,
})
export class ElectionPanel {
  readonly feature = input.required<RoomFeature>();
  readonly f = computed(() => this.feature() as LeninSquareFeature);
}
