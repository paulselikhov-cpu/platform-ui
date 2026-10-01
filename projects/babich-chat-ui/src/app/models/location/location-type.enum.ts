/**
 * Тип локации (зеркало бэкенд-enum LocationType).
 * Классификация на 3 значения; конкретная разновидность локации задаётся
 * полем `code` (см. SystemLocationCode), а не этим enum.
 */
export enum LocationType {
  /** Системная локация района (мэрия, площадь Ленина, банк…) */
  SYSTEM = 'SYSTEM',
  /** Пользовательская локация без выделенной роли */
  DEFAULT = 'DEFAULT',
  /** Пользовательская бизнес-локация. Резерв: пока не создаётся */
  BUSINESS = 'BUSINESS'
}

/** Человекочитаемые названия типов локаций. */
export const LOCATION_TYPE_LABELS: Record<LocationType, string> = {
  [LocationType.SYSTEM]: 'Системная',
  [LocationType.DEFAULT]: 'Обычная',
  [LocationType.BUSINESS]: 'Бизнес-локация',
};

/**
 * Коды системных локаций района (зеркало бэкенд SystemLocationCode).
 * Хранятся в `Location.code`. Уникальны в пределах района, а не глобально:
 * у каждого района своя «Площадь Ленина».
 */
export const SystemLocationCode = {
  CITY_HALL: 'CITY_HALL',
  LENIN_SQUARE: 'LENIN_SQUARE',
  POLICE_STATION: 'POLICE_STATION',
  PRISON: 'PRISON',
  BANK: 'BANK',
  WAREHOUSE: 'WAREHOUSE',
  GENERAL_MARKET: 'GENERAL_MARKET',
  REAL_ESTATE_MARKET: 'REAL_ESTATE_MARKET',
} as const;

export type SystemLocationCode = (typeof SystemLocationCode)[keyof typeof SystemLocationCode];
