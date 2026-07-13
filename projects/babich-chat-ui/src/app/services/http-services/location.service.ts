import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILocation, ICreateLocationRequest, ILocationTemplate, IRoom, ILocationUser, UserPresenceFilter, IPagedResult } from '../../models/location/location.interface';

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

  /**
   * @deprecated
   */
  getOnlineCount(locationId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl()}/${locationId}/online-count`);
  }

  getOnlineCharacterIds(locationId: number): Observable<number[]> {
    return this.http.get<number[]>(`/api/locations/${locationId}/online-ids`);
  }

  getLocationUsers(
    locationId: number,
    params: { query?: string; filter: UserPresenceFilter; page: number; size: number }
  ): Observable<IPagedResult<ILocationUser>> {
    let httpParams = new HttpParams()
      .set('page', params.page)
      .set('size', params.size)
      .set('filter', params.filter);
    if (params.query) httpParams = httpParams.set('query', params.query);

    return this.http.get<IPagedResult<ILocationUser>>(
      `${this.baseUrl()}/${locationId}/users`,
      { params: httpParams }
    );
  }
}