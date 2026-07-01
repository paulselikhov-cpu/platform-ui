export interface IChatMessage {
  type: 'CHAT' | 'JOIN' | 'LEAVE';
  content: string;
  sender: string;
  roomId: string;
  timestamp: string;
}