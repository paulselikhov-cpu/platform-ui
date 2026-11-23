import { ILocation } from '../../models/location/location.interface';
import { LocationType, SystemLocationCode } from '../../models/location/location-type.enum';

/**
 * Иконка локации по её code. Ключ — code, а не LocationType: тип различает
 * лишь SYSTEM/DEFAULT/BUSINESS, поэтому системные локации узнаются только
 * по code.
 */
const LOCATION_ICONS: Record<string, string> = {
  [SystemLocationCode.CITY_HALL]: '🏛️',
  [SystemLocationCode.LENIN_SQUARE]: '🗳️',
  [SystemLocationCode.POLICE_STATION]: '🚓',
  [SystemLocationCode.PRISON]: '🔒',
  [SystemLocationCode.BANK]: '🏦',
  [SystemLocationCode.WAREHOUSE]: '📦',
  [SystemLocationCode.GENERAL_MARKET]: '🏬',
  [SystemLocationCode.REAL_ESTATE_MARKET]: '🏘️',
  [LocationType.BUSINESS]: '🏪',
};

/** Иконка локации: по code у системных, по типу у заведений, иначе 📍. */
export function resolveLocationIcon(location: ILocation | null): string {
  if (location == null) return '📍';
  const code = location.code;
  if (code && LOCATION_ICONS[code]) return LOCATION_ICONS[code];
  return location.type === LocationType.BUSINESS ? LOCATION_ICONS[LocationType.BUSINESS] : '📍';
}