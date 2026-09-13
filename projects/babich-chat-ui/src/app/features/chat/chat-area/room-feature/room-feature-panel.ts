import { Component, input } from '@angular/core';
import { RoomFeature } from './room-feature.interface';
import { ElectionPanel } from './lening-square/election.panel';
import { GovernorsOfficePanel } from './governors-office/governors-office.panel';
import { ReceptionPanel } from './reception/reception.panel';

/**
 * Рендер контент-части фичи комнаты в chat-area по feature.contentKey.
 * Добавление новой комнаты не требует правки этого компонента, если
 * панель уже зарегистрирована; новая панель = новый @case.
 */
@Component({
  selector: 'app-room-feature-panel',
  imports: [ElectionPanel, GovernorsOfficePanel, ReceptionPanel],
  templateUrl: './room-feature-panel.html',
  styleUrl: './room-feature-panel.scss',
})
export class RoomFeaturePanel {
  readonly feature = input.required<RoomFeature>();
}
