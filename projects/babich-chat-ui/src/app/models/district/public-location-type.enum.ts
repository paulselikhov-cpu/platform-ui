/**
 * Типы системных (общественных) локаций района.
 * Согласно концепции babichchat (раздел 8).
 */
export enum PublicLocationType {
  /** Мэрия — управление районом */
  CITY_HALL = 'CITY_HALL',
  
  /** Площадь Ленина — народные голосования, комната "Тёплые трубы" для бомжей */
  LENIN_SQUARE = 'LENIN_SQUARE',
  
  /** Полицейский участок*/
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
  REAL_ESTATE_MARKET = 'REAL_ESTATE_MARKET'
}

/**
 * Человекочитаемые названия типов локаций
 */
export const PUBLIC_LOCATION_TYPE_LABELS: Record<PublicLocationType, string> = {
  [PublicLocationType.CITY_HALL]: 'Мэрия',
  [PublicLocationType.LENIN_SQUARE]: 'Площадь Ленина',
  [PublicLocationType.POLICE_STATION]: 'Полицейский участок',
  [PublicLocationType.PRISON]: 'Тюрьма',
  [PublicLocationType.BANK]: 'Банк',
  [PublicLocationType.WAREHOUSE]: 'Склад',
  [PublicLocationType.GENERAL_MARKET]: 'Магазин',
  [PublicLocationType.REAL_ESTATE_MARKET]: 'Рынок недвижимости'
};
