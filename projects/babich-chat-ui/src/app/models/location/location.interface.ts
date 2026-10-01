export interface ILocationTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  priceCoin: number;
  isExtendable: boolean;
  extendPriceCoin: number | null;
  imageUrl: string | null;
  templateRooms: ITemplateRoom[];
}

export interface ITemplateRoom {
  id: number;
  code: RoomCode,
  name: string;
  description: string;
  orderIndex: number;
}

import { LocationType } from './location-type.enum';

export interface ILocation {
  id: number;
  /**
   * Код локации — её адрес в URL: /chat/location/{code}/...
   * Уникален в пределах района (у системных — одна из констант SystemLocationCode).
   */
  code: string;
  name: string;
  description: string;
  type?: LocationType;
  inviteCode?: string;
  isPublic?: boolean;
  template?: ILocationTemplate;
  memberRole?: 'OWNER' | 'MODERATOR' | 'MEMBER' | 'SYSTEM';
}

export interface IRoom {
  id: number;
  code: RoomCode,
  name: string;
  description: string;
  storeHistory: boolean;
  isCustom: boolean;
  orderIndex: number;
}

export interface ICreateLocationRequest {
  templateId: number;
  /** Код локации, придуманный игроком: латиница, цифры и «_», 3–50 символов */
  code: string;
  name: string;
  description: string;
  isPublic: boolean;
  characterId: number;
}

export enum RoomCode {
    LENIN_SQUARE = "LENIN_SQUARE",
    GOVERNORS_OFFICE = "GOVERNORS_OFFICE",
    DEFAULT = 'DEFAULT',
    RECEPTION = 'RECEPTION'
}
