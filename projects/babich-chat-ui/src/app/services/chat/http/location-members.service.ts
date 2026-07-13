import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILocationUser, IPagedResult, UserPresenceFilter } from '../../../models/location-members/location-members.interface';

@Injectable({ providedIn: 'root' })
export class LocationMembersService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/location-members')

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

  /**
  * @not_used
  */
  getOnlineCount(locationId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl()}/${locationId}/online-count`);
  }

  /**
  * @not_used
  */
  getOnlineCharacterIds(locationId: number): Observable<number[]> {
    return this.http.get<number[]>(`${this.baseUrl()}/${locationId}/online-ids`);
  }
}