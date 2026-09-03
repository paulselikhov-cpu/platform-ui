export enum LocationPostType {
  GOVERNOR = 'GOVERNOR',
  MAYOR = 'MAYOR',
  DEPUTY = 'DEPUTY',
  POLICE_OFFICER = 'POLICE_OFFICER',
  BANK_DIRECTOR = 'BANK_DIRECTOR',
  BANK_EMPLOYEE = 'BANK_EMPLOYEE',
  REAL_ESTATE_DIRECTOR = 'REAL_ESTATE_DIRECTOR',
}

/**
 * Должность персонажа в системной локации
 * (ответ GET /api/location-posts/by-location/{locationId} — уже с именем персонажа).
 */
export interface ILocationPost {
  id: number;
  characterId: number;
  characterName: string;
  post: LocationPostType | string;
  appointedAt: string;
}
