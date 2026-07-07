export interface IChatMessageResponse {
  id: number  | null; 
  actionType: MessageActionType;
  content: string  | null;
  timestamp: string;     
  isDeleted: boolean;
  character: ICharacterInfo;
}

export interface ICharacterInfo {
  characterName: string;
  userId: number | null;
  avatarUrl: string | null;
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
