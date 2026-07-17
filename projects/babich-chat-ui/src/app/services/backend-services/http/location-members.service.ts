import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserPresenceFilter, IPagedResult, ILocationUser } from '../../../models/location-members/location-members.interface';
import { ILocationUnreadSummary } from '../../../models/messages/unread/unread.interface';

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

  getUnreadCounts(locationIds: number[], characterId: number): Observable<Record<number, number>> {
    const params = new HttpParams()
      .set('locationIds', locationIds.join(','))
      .set('characterId', characterId);
    return this.http.get<Record<number, number>>(`${this.baseUrl()}/unread-counts`, { params });
  }

  getUnreadSummary(locationId: number, characterId: number): Observable<ILocationUnreadSummary> {
    return this.http.get<ILocationUnreadSummary>(
      `${this.baseUrl()}/${locationId}/unread`,
      { params: { characterId } }
    );
  }
}