export interface IChatMessageResponse {
  id: number; 
  actionType: MessageActionType;
  content: string;
  timestamp: string;     
  isDeleted?: boolean;
  character?: ICharacterInfo;
}

export interface IChatMessageActionResponse {
  actionType: MessageActionType;
  content: string;
  timestamp: string;     
}

export interface ICharacterInfo {
  characterName: string;
  userId?: number;
  avatarUrl?: string | null;
}
export interface IChatMessageParams {
  roomId: string;
  content: string;
}

export interface IChatActionMessageParams {
  actionType: MessageActionType;
  roomId: string;
}

export type MessageActionType = 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING';
export type MessageType = 'CHAT' | 'ACTION' | 'SYSTEM';
