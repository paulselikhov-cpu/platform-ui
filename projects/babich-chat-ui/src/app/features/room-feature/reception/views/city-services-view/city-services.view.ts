import { Component, input } from '@angular/core';
import { RoomFeature } from '../../../room-feature.interface';
import { ReceptionMenu } from './reception-menu/reception-menu';

/**
 * Режим «Услуги мэрии» (приёмная): подача заявок жителем.
 * Кнопка режима видна НЕ-авторизованным сотрудникам (жителям) — см.
 * ReceptionFeature.views; авторизованный сотрудник видит «Личный кабинет».
 */
@Component({
  selector: 'app-city-services-view',
  imports: [ReceptionMenu],
  templateUrl: './city-services.view.html',
  styleUrl: './city-services.view.scss',
})
export class CityServicesView {
  readonly feature = input.required<RoomFeature>();
}
