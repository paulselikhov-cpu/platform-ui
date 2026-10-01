import { BaseLocationFeature, LocationFeatureContext } from '../location-feature.interface';

/**
 * Фича бизнес-локации (LocationType.BUSINESS). Заглушка: разделов и действий
 * пока нет. Реализация раздела появится отдельно; ядро (главное меню локации,
 * шапка, чат) от неё не зависит.
 */
export class BusinessFeature extends BaseLocationFeature {
  constructor(ctx: LocationFeatureContext) {
    super();
    this.init(ctx);
  }
}
