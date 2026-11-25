import { BaseRoomFeature, RoomFeatureContext } from "../../room-feature.interface";
import { BacketPanelComponent } from "./tabs/backet-panel/backet-panel.component";
import { ShopProductsPanelComponent } from "./tabs/products-panel/products-panel.component";

/**
 * Фича комнаты «Торговый зал» магазина.
 * Добавляет вкладки «Продукты» и «Корзина» в таб-бар RoomView.
 */
export class ShopMainRoomFeature extends BaseRoomFeature {
  constructor(ctx: RoomFeatureContext) {
    super();
    this.init(ctx);
  }

  override readonly tabs = [
    {
      id: 'products',
      label: 'Продукты',
      component: ShopProductsPanelComponent,
    },
    {
      id: 'cart',
      label: 'Корзина',
      component: BacketPanelComponent,
    },
  ];
}
