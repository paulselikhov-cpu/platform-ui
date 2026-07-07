export interface IChatMessage {
  id: number;    
  messageType?: MessageType,     
  actionType: MessageActionType; // null для JOIN/LEAVE/TYPING
  content: string;
  roomId: string;
  timestamp: string;
  isDeleted: boolean;
  character: ICharacterInfo | null; // null для JOIN/LEAVE/TYPING
}

export type MessageActionType = 'CHAT' | 'JOIN' | 'LEAVE' | 'TYPING';
export type MessageType = 'CHAT' | 'ACTION' | 'SYSTEM';
export interface ICharacterInfo {
  userId: number;
  characterName: string;
  avatarUrl: string | null;
}