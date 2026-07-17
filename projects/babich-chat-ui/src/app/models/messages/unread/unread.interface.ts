export interface IUnreadUpdateEvent {
  roomId: number;
  locationId: number;
  roomUnreadCount: number;
}

export interface ILocationUnreadSummary {
  unreadByRoomId: Record<number, number>;
  total: number;
}