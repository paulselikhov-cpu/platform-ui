export type IChatMessageResponse = IChatMessage | IDeleteMessage | ISystemMessage;

export interface IRoomHistoryResponse {
  messages: IChatMessageResponse[];
  firstUnreadMessageId: number | null;
  unreadCount: number;
}

export type MessageActionType = 'CHAT' | 'JOIN' | 'TYPING' | 'DELETE';
export type MessageType = 'CHAT' | 'ACTION' | 'SYSTEM';
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
  replyTo?: IReplyPreview | null;
}

export interface IDeleteMessage extends IChatMessageBase {
  actionType: 'DELETE';
  id: number;
  character: ICharacterInfoPartial
}

export interface ISystemMessage extends IChatMessageBase {
  actionType: 'JOIN' | 'TYPING';
  character: ICharacterInfo;
}

//Интерфейс данных пользователя
interface ICharacterInfoBase {
  characterName: string;
  avatarUrl: string | null;
}

// расширенный
interface ICharacterInfo extends ICharacterInfoBase {
  userId: number;
}

// без userId — для DELETE
interface ICharacterInfoPartial extends ICharacterInfoBase {
  userId: null;
}

// Входные параметры 
export interface IChatMessageParams {
  roomId: string;
  content: string;
  replyToId?: number;
}

export interface IChatActionMessageParams {
  actionType: MessageActionType;
  roomId: string;
  locationId: string;
}
export interface IReplyPreview {
  id: number;
  content: string | null; // null, если родитель удалён
  senderName: string | null;
  isDeleted: boolean;
}