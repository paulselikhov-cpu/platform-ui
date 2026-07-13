export interface IPresenceEvent {
  characterId: number;
  online: boolean;
  roomId: number | null;
}