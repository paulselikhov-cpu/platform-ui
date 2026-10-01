import { Component, computed, input } from '@angular/core';
import { ElectionTable } from '../../../../shared/components/election-table/election-table';
import { LocationFeature } from '../../location-feature.interface';
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
  readonly feature = input.required<LocationFeature>();
  readonly f = computed(() => this.feature() as LeninSquareFeature);
}