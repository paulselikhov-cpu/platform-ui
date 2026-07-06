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

export interface IChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  content: string;
  sender: string;
  roomId: string;
  timestamp: string;
}