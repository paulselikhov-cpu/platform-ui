import { BaseRoomFeature, RoomFeatureContent, RoomFeatureContext } from '../room-feature.interface';

/**
 * Фича комнаты «Приёмная»: пока только контент-панель (заявка на паспорт).
 * По мере появления действий мэрии — пункты меню добавляются в menuItems.
 */
export class ReceptionFeature extends BaseRoomFeature {
  override readonly contentKey: RoomFeatureContent = 'reception';

  constructor(ctx: RoomFeatureContext) {
    super();
    this.init(ctx);
  }
}
