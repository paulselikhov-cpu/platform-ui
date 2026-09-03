import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ILocationPost } from '../../../models/location-post/location-post.interface';

@Injectable({ providedIn: 'root' })
export class LocationPostService {
  private http = inject(HttpClient);
  private baseUrl = '/api/location-posts';

  /** Должности в системной локации (с именами персонажей). */
  getPostsByLocation(locationId: number): Observable<ILocationPost[]> {
    return this.http.get<ILocationPost[]>(`${this.baseUrl}/by-location/${locationId}`);
  }
}
