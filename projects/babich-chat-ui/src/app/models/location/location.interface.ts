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

export interface IHistoryMessage {
  id: number;
  content: string;
  type: 'CHAT' | 'ACTION' | 'SYSTEM';
  isDeleted: boolean;
  createdAt: string;
  character: {
    userId: number;
    characterName: string;
    avatarUrl: string | null;
  } | null;
}