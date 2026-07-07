export interface IChatMessageResponse {
  actionType: MessageActionType;
  content: string;
  timestamp: string;
  //
  id?: number; // null для JOIN/LEAVE/TYPING        
  isDeleted?: boolean; // null для JOIN/LEAVE/TYPING
  character?: ICharacterInfo; // null для JOIN/LEAVE/TYPING
}

export interface ICharacterInfo {
  characterName: string;
  userId?: number;
  avatarUrl?: string | null;
}
export interface IChatMessageParams {
  actionType: MessageActionType;
  roomId: string;
  content?: string;
}

export type MessageActionType = 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING';
export type MessageType = 'CHAT' | 'ACTION' | 'SYSTEM';
