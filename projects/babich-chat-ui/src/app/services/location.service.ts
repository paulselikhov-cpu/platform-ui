import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILocation, ICreateLocationRequest, IHistoryMessage, ILocationTemplate, IRoom } from '../models/location/location.interface';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);

  getPublicLocations(): Observable<ILocation[]> {
    return this.http.get<ILocation[]>('/api/locations');
  }

  getMyLocations(characterId: number): Observable<ILocation[]> {
    return this.http.get<ILocation[]>(`/api/locations/my/${characterId}`);
  }

  getTemplates(): Observable<ILocationTemplate[]> {
    return this.http.get<ILocationTemplate[]>('/api/location-templates');
  }

  createLocation(request: ICreateLocationRequest): Observable<ILocation> {
    return this.http.post<ILocation>('/api/locations', request);
  }

  joinLocation(inviteCode: string, characterId: number): Observable<any> {
    return this.http.post(`/api/locations/join/${inviteCode}?characterId=${characterId}`, {});
  }

  getRooms(locationId: number): Observable<IRoom[]> {
    return this.http.get<IRoom[]>(`/api/locations/${locationId}/rooms`);
  }

  getMessageHistory(roomId: number, page = 0, size = 50): Observable<IHistoryMessage[]> {
    return this.http.get<IHistoryMessage[]>(
      `/api/messages/room/${roomId}?page=${page}&size=${size}`
    );
  }
}