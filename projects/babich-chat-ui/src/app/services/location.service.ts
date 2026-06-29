import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface LocationTemplate {
  id: number;
  code: string;
  name: string;
  description: string;
  priceCoin: number;
  isExtendable: boolean;
  extendPriceCoin: number | null;
  imageUrl: string | null;
  templateRooms: TemplateRoom[];
}

export interface TemplateRoom {
  id: number;
  name: string;
  description: string;
  orderIndex: number;
}

export interface Location {
  id: number;
  name: string;
  description: string;
  inviteCode: string;
  isPublic: boolean;
  template: LocationTemplate;
}

export interface Room {
  id: number;
  name: string;
  description: string;
  storeHistory: boolean;
  isCustom: boolean;
  orderIndex: number;
}

export interface CreateLocationRequest {
  templateId: number;
  name: string;
  description: string;
  isPublic: boolean;
  characterId: number;
}

@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);

  getPublicLocations(): Observable<Location[]> {
    return this.http.get<Location[]>('/api/locations');
  }

  getMyLocations(characterId: number): Observable<Location[]> {
    return this.http.get<Location[]>(`/api/locations/my/${characterId}`);
  }

  getTemplates(): Observable<LocationTemplate[]> {
    return this.http.get<LocationTemplate[]>('/api/location-templates');
  }

  createLocation(request: CreateLocationRequest): Observable<Location> {
    return this.http.post<Location>('/api/locations', request);
  }

  joinLocation(inviteCode: string, characterId: number): Observable<any> {
    return this.http.post(`/api/locations/join/${inviteCode}?characterId=${characterId}`, {});
  }

  getRooms(locationId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`/api/locations/${locationId}/rooms`);
  }
}