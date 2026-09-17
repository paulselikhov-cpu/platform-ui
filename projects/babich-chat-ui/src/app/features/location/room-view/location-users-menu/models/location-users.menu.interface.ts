import { ILocationUser } from "../../../../../models/location-users/location-users.interface";

export type SearchMode = 'room' | 'user';

export interface RoomGroup {
  roomId: number;
  roomName: string;
  users: ILocationUser[];
}