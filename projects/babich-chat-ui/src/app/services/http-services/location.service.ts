import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { delay, Observable, of } from 'rxjs';
import { ILocation, ICreateLocationRequest, ILocationTemplate, IRoom, ILocationUser, UserPresenceFilter, IPagedResult } from '../../models/location/location.interface';
import { buildMockUsers } from '../../features/location/location-view/location-users-menu/test/mock';

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

  getLocationUsers(
  locationId: number,
  params: { query?: string; filter: UserPresenceFilter; page: number; size: number }
): Observable<IPagedResult<ILocationUser>> {
  const mockDatasets: Record<number, ILocationUser[]> = {
    8: buildMockUsers(8),
    9: buildMockUsers(9),
  };

  const now = Date.now();
  let all = mockDatasets[locationId] ?? [];

  if (params.filter === 'online') all = all.filter((u) => u.online);
  if (params.filter === 'offline') all = all.filter((u) => !u.online);

  if (params.query) {
    const q = params.query.toLowerCase();
    all = all.filter((u) => u.characterName.toLowerCase().includes(q));
  }

  const start = params.page * params.size;
  const pageItems = all.slice(start, start + params.size);
  const hasMore = start + params.size < all.length;

  return of({ items: pageItems, hasMore }).pipe(delay(300));

  // Реальный вызов, когда бэкенд готов:
  // let httpParams = new HttpParams()
  //   .set('page', params.page)
  //   .set('size', params.size)
  //   .set('filter', params.filter);
  // if (params.query) httpParams = httpParams.set('query', params.query);
  // return this.http.get<IPagedResult<ILocationUser>>(
  //   `${this.baseUrl()}/${locationId}/users`,
  //   { params: httpParams }
  // );
}

  // getLocationUsers(locationId: number): Observable<ILocationUser[]> {
  //   return this.http.get<ILocationUser[]>(`${this.baseUrl()}/${locationId}/users`);
  // }
}