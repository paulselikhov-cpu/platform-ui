export type UserPresenceFilter = 'all' | 'online' | 'offline';

export interface ILocationUser {
  characterId: number;
  characterName: string;
  online: boolean;
  roomId: number | null;
  roomName: string | null;
  lastSeenAt: string | null; // ISO string, null если online
}

export interface IPagedResult<T> {
  items: T[];
  hasMore: boolean;
}
