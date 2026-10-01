/**
 * Тип локации (единая классификация, зеркало бэкенд-enum LocationType).
 * Системные локации района (CITY_HALL…REAL_ESTATE_MARKET) + пользовательские (BUSINESS/HOME).
 */
export enum LocationType {
  // === Системные локации района ===
  /** Мэрия — управление районом */
  CITY_HALL = 'CITY_HALL',
  /** Площадь Ленина — народные голосования, комната "Тёплые трубы" для бомжей */
  LENIN_SQUARE = 'LENIN_SQUARE',
  /** Полицейский участок */
  POLICE_STATION = 'POLICE_STATION',
  /** Тюрьма — место содержания нарушителей */
  PRISON = 'PRISON',
  /** Банк — вклады, ипотека */
  BANK = 'BANK',
  /** Склад — закупка товаров для бизнеса */
  WAREHOUSE = 'WAREHOUSE',
  /** Магазин */
  GENERAL_MARKET = 'GENERAL_MARKET',
  /** Рынок недвижимости — купля-продажа локаций */
  REAL_ESTATE_MARKET = 'REAL_ESTATE_MARKET',

  // === Пользовательские локации ===
  /** Бизнес-локация (заведение) */
  BUSINESS = 'BUSINESS',
  /** Жилая локация (квартира) */
  HOME = 'HOME',
}

/** Человекочитаемые названия типов локаций. */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  [LocationType.CITY_HALL]: 'Мэрия',
  [LocationType.LENIN_SQUARE]: 'Площадь Ленина',
  [LocationType.POLICE_STATION]: 'Полицейский участок',
  [LocationType.PRISON]: 'Тюрьма',
  [LocationType.BANK]: 'Банк',
  [LocationType.WAREHOUSE]: 'Склад',
  [LocationType.GENERAL_MARKET]: 'Магазин',
  [LocationType.REAL_ESTATE_MARKET]: 'Рынок недвижимости',
  [LocationType.BUSINESS]: 'Бизнес-локация',
  [LocationType.HOME]: 'Жилая локация',
};
