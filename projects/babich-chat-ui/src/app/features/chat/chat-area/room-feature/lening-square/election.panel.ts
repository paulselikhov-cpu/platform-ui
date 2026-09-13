import { Component, computed, input } from '@angular/core';
import { ElectionTable } from '../../../../../shared/components/election-table/election-table';
import { RoomFeature } from '../room-feature.interface';
import { LeninSquareFeature } from './lenin-square.feature';


/** Мини-таблица выборов фичи «Площадь Ленина» */
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
