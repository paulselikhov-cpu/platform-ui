import { ILocationUser } from "../../../../../models/location/location.interface";

export type SearchMode = 'room' | 'user';

export interface RoomGroup {
  roomId: number;
  roomName: string;
  users: ILocationUser[];
}