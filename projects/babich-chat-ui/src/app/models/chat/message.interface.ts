export type IChatMessageResponse = IChatMessage | IDeleteMessage | ISystemMessage;
export interface IChatMessageBase  {
  timestamp: string;
  roomId: string;
}

export interface IChatMessage extends IChatMessageBase {
  actionType: 'CHAT';
  id: number;
  content: string;
  isDeleted: boolean;
  character: ICharacterInfo;
}

export interface IDeleteMessage extends IChatMessageBase {
  actionType: 'DELETE';
  id: number;
  character: ICharacterInfoPartial
}

export interface ISystemMessage extends IChatMessageBase {
  actionType: 'JOIN' | 'LEAVE' | 'TYPING';
  character: ICharacterInfoPartial
}


interface ICharacterInfoBase {
  characterName: string;
  avatarUrl: string | null;
}

// расширенный — для CHAT, есть userId
interface ICharacterInfo extends ICharacterInfoBase {
  userId: number;
}

// без userId — для JOIN/LEAVE/TYPING
interface ICharacterInfoPartial extends ICharacterInfoBase {
  userId: null;
}

export interface IChatMessageParams {
  roomId: string;
  content: string;
}

export interface IChatActionMessageParams {
  actionType: MessageActionType;
  roomId: string;
}

export type MessageActionType = 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING' | 'DELETE';
export type MessageType = 'CHAT' | 'ACTION' | 'SYSTEM';
