import { Component, input } from '@angular/core';
import { ReceptionMenu } from '../../components/reception-menu/reception-menu';
import { RoomFeature } from '../room-feature.interface';

/** Контент-панель фичи «Приёмная». */
@Component({
  selector: 'app-reception-panel',
  imports: [ReceptionMenu],
  template: `<app-reception-menu />`,
})
export class ReceptionPanel {
  readonly feature = input.required<RoomFeature>();
}
