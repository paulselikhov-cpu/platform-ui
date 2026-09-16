import { ILocationUser } from "../../../../../models/location-members/location-members.interface";

export type SearchMode = 'room' | 'user';

export interface RoomGroup {
  roomId: number;
  roomName: string;
  users: ILocationUser[];
}