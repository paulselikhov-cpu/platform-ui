import { RoomCode } from '../../../../models/location/location.interface';
import { RoomFeature, RoomFeatureContext } from './room-feature.interface';
import { GovernorsOfficeFeature } from './governors-office/governors-office.feature';
import { LeninSquareFeature } from './lening-square/lenin-square.feature';
import { ReceptionFeature } from './reception/reception.feature';

/**
 * Фабрика фич комнат: по RoomCode создаёт реализацию RoomFeature.
 * Новая комната = новая реализация + одна строка здесь. Ядро chat-area
 * и header ничего про конкретные комнаты не знают.
 */
export function resolveRoomFeature(ctx: RoomFeatureContext): RoomFeature | null {
  switch (ctx.room.code) {
    case RoomCode.LENIN_SQUARE:
      return new LeninSquareFeature(ctx);
    case RoomCode.GOVERNORS_OFFICE:
      return new GovernorsOfficeFeature(ctx);
    case RoomCode.RECEPTION:
      return new ReceptionFeature(ctx);
    default:
      return null;
  }
}
