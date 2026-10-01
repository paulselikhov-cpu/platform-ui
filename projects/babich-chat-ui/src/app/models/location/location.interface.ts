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
  name: string;
  description: string;
  type?: LocationType;
  inviteCode?: string;
  isPublic?: boolean;
  isSystem?: boolean;
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
