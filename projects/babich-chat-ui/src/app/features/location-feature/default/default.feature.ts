import { BaseLocationFeature, LocationFeatureContext } from '../location-feature.interface';

/**
 * Фича обычной (дефолтной) локации: обычная локация (LocationType.DEFAULT), а также
 * прочие системные типы, для которых отдельная фича ещё не сделана.
 * Заглушка: разделов и действий пока нет.
 */
export class DefaultLocationFeature extends BaseLocationFeature {
  constructor(ctx: LocationFeatureContext) {
    super();
    this.init(ctx);
  }
}
