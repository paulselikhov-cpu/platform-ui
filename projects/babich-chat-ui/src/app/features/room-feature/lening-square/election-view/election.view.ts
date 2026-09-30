import { Component, computed, input } from '@angular/core';
import { ElectionTable } from '../../../../shared/components/election-table/election-table';
import { RoomFeature } from '../../room-feature.interface';
import { LeninSquareFeature } from '../lenin-square.feature';

/**
 * Режим «Выборы» (Площадь Ленина): мини-таблица выборов района.
 * Компонент режима получает свою фичу через input `feature`.
 */
@Component({
  selector: 'app-election-view',
  imports: [ElectionTable],
  templateUrl: './election.view.html',
  styleUrl: './election.view.scss',
})
export class ElectionView {
  readonly feature = input.required<RoomFeature>();
  readonly f = computed(() => this.feature() as LeninSquareFeature);
}