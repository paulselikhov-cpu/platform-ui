import { ShopMainRoomFeature } from './general-market/shop-main/shop-cart-room-feature';
import { RoomFeature, RoomFeatureContext } from './room-feature.interface';

/**
 * Фабрика фич комнат: по {@code Room.code} выбирает реализацию RoomFeature.
 * Новая комната = новая реализация + одна строка здесь. Ядро (RoomView, chat-area)
 * ничего про конкретные комнаты не знает.
 *
 * Выбор идёт по `code` комнаты.
 *
 * - SHOP_MAIN — своя фича для торгового зала магазина;
 * — всё остальное — null (в комнате только вкладка «Чат»).
 */
export function resolveRoomFeature(ctx: RoomFeatureContext): RoomFeature | null {
  switch (ctx.room.code) {
    case 'GENERAL_MARKET_MAIN':
      return new ShopMainRoomFeature(ctx);
  }
  return null;
}
