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
  name: string;
  description: string;
  orderIndex: number;
}

export interface ILocation {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  isPublic: boolean;
  template: ILocationTemplate;
  memberRole?: 'OWNER' | 'MODERATOR' | 'MEMBER';
}

export interface IRoom {
  id: number;
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

export type UserPresenceFilter = 'all' | 'online' | 'offline';

export interface ILocationUser {
  characterId: number;
  characterName: string;
  online: boolean;
  roomId: number | null;
  roomName: string | null;
  lastSeenAt: string | null; // ISO string, null если online
}

export interface IPagedResult<T> {
  items: T[];
  hasMore: boolean;
}

export interface IPresenceEvent {
  characterId: number;
  online: boolean;
  roomId: number | null;
}