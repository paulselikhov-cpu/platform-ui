export type UserPresenceFilter = 'all' | 'online' | 'offline';

export interface ILocationUser {
  characterId: number;
  characterName: string;
  online: boolean;
  roomId: number | null;
  roomName: string | null;
  lastSeenAt: string | null; // ISO string, null если online
  systemRole?: string | null; // должность в системной локации (null — обычный участник)
  appointedAt?: string | null; // когда назначен на должность
}

export interface IPagedResult<T> {
  items: T[];
  hasMore: boolean;
}