import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILocation, ILocationTemplate, ICreateLocationRequest, IRoom } from '../../../models/location/location.interface';

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/locations')

  getPublicLocations(): Observable<ILocation[]> {
    return this.http.get<ILocation[]>(this.baseUrl());
  }

  getMyLocations(characterId: number): Observable<ILocation[]> {
    return this.http.get<ILocation[]>(`${this.baseUrl()}/my/${characterId}`);
  }

  getTemplates(): Observable<ILocationTemplate[]> {
    return this.http.get<ILocationTemplate[]>('/api/location-templates');
  }

  createLocation(request: ICreateLocationRequest): Observable<ILocation> {
    return this.http.post<ILocation>(this.baseUrl(), request);
  }

  joinLocation(inviteCode: string, characterId: number): Observable<any> {
    return this.http.post(`${this.baseUrl()}/join/${inviteCode}?characterId=${characterId}`, {});
  }

  getRooms(locationId: number): Observable<IRoom[]> {
    return this.http.get<IRoom[]>(`${this.baseUrl()}/${locationId}/rooms`);
  }

  leaveLocation(locationId: number, characterId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl()}/${locationId}/leave?characterId=${characterId}`
    );
  }

  deleteLocation(locationId: number, characterId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.baseUrl()}/${locationId}?characterId=${characterId}`
    );
  }
}