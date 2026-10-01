import { LocationType, SystemLocationCode } from '../../models/location/location-type.enum';
import { LocationFeature, LocationFeatureContext } from './location-feature.interface';
import { CityHallFeature } from './city-hall/city-hall.feature';
import { LeninSquareFeature } from './lenin-square/lenin-square.feature';
import { BusinessFeature } from './business/business.feature';
import { DefaultLocationFeature } from './default/default.feature';

/**
 * Фабрика фич локаций: по {@code Location.code} выбирает реализацию LocationFeature.
 * Новая локация = новая реализация + одна строка здесь. Ядро (главное меню
 * локации, шапка, чат) ничего про конкретные локации не знает.
 *
 * Выбор идёт по `code`, а не по `type`: тип различает лишь
 * SYSTEM/DEFAULT/BUSINESS и не говорит, какая перед нами системная локация.
 *
 * - CITY_HALL / LENIN_SQUARE — своя фича на системную локацию;
 * - BUSINESS — бизнес-локации;
 * - всё остальное (DEFAULT и прочие системные коды) — дефолтная фича.
 */
export function resolveLocationFeature(ctx: LocationFeatureContext): LocationFeature {
  switch (ctx.location.code) {
    case SystemLocationCode.CITY_HALL:
      return new CityHallFeature(ctx);
    case SystemLocationCode.LENIN_SQUARE:
      return new LeninSquareFeature(ctx);
  }
  if (ctx.location.type === LocationType.BUSINESS) {
    return new BusinessFeature(ctx);
  }
  return new DefaultLocationFeature(ctx);
}
