import { BaseLocationFeature, LocationFeatureContext } from '../location-feature.interface';

/**
 * Фича обычной (дефолтной) локации: жилая локация (LocationType.HOME), а также
 * прочие системные типы, для которых отдельная фича ещё не сделана.
 * Заглушка: разделов и действий пока нет.
 */
export class DefaultLocationFeature extends BaseLocationFeature {
  constructor(ctx: LocationFeatureContext) {
    super();
    this.init(ctx);
  }
}
