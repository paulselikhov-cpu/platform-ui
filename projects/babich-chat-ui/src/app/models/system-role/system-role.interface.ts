export enum SystemRoleType {
  GOVERNOR = 'GOVERNOR',
  MAYOR = 'MAYOR',
  DEPUTY = 'DEPUTY',
  POLICE_OFFICER = 'POLICE_OFFICER',
  BANK_DIRECTOR = 'BANK_DIRECTOR',
  BANK_EMPLOYEE = 'BANK_EMPLOYEE',
  REAL_ESTATE_DIRECTOR = 'REAL_ESTATE_DIRECTOR',
}

/**
 * Должность персонажа в системной локации с именем занимающего
 * (ответ GET /api/location-users/{locationId}/system-roles).
 */
export interface ILocationSystemRole {
  id: number;
  locationId: number;
  characterId: number;
  characterName: string;
  systemRole: SystemRoleType | string;
  appointedAt: string;
}