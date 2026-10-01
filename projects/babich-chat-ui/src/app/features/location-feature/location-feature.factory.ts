import { LocationType } from '../../models/location/location-type.enum';
import { LocationFeature, LocationFeatureContext } from './location-feature.interface';
import { CityHallFeature } from './city-hall/city-hall.feature';
import { LeninSquareFeature } from './lenin-square/lenin-square.feature';
import { BusinessFeature } from './business/business.feature';
import { DefaultLocationFeature } from './default/default.feature';

/**
 * Фабрика фич локаций: по {@link LocationType} выбирает реализацию LocationFeature.
 * Новая локация = новая реализация + одна строка здесь. Ядро (главное меню
 * локации, шапка, чат) ничего про конкретные локации не знает.
 *
 * - CITY_HALL / LENIN_SQUARE — своя фича на системную локацию;
 * - BUSINESS — бизнес-локации;
 * - всё остальное (HOME, прочие системные типы) — дефолтная фича.
 */
export function resolveLocationFeature(ctx: LocationFeatureContext): LocationFeature {
  switch (ctx.location.type) {
    case LocationType.CITY_HALL:
      return new CityHallFeature(ctx);
    case LocationType.LENIN_SQUARE:
      return new LeninSquareFeature(ctx);
    case LocationType.BUSINESS:
      return new BusinessFeature(ctx);
    default:
      return new DefaultLocationFeature(ctx);
  }
}
