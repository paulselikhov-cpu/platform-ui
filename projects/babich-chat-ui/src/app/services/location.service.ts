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

/**
 * Сервис для работы с локациями.
 * Все методы возвращают Observable — подписываемся в компонентах.
 */
@Injectable({ providedIn: 'root' })
export class LocationService {
  private http = inject(HttpClient);

  // получить все публичные локации
  getPublicLocations(): Observable<Location[]> {
    return this.http.get<Location[]>('/api/locations');
  }

  // получить мои локации (где я участник)
  getMyLocations(characterId: number): Observable<Location[]> {
    return this.http.get<Location[]>(`/api/locations/my/${characterId}`);
  }

  // получить все шаблоны
  getTemplates(): Observable<LocationTemplate[]> {
    return this.http.get<LocationTemplate[]>('/api/location-templates');
  }

  // создать локацию из шаблона
  createLocation(request: CreateLocationRequest): Observable<Location> {
    return this.http.post<Location>('/api/locations', request);
  }

  // вступить в локацию по invite code
  joinLocation(inviteCode: string, characterId: number): Observable<any> {
    return this.http.post(
      `/api/locations/join/${inviteCode}?characterId=${characterId}`,
      {}
    );
  }

  // получить комнаты локации
  getRooms(locationId: number): Observable<Room[]> {
    return this.http.get<Room[]>(`/api/locations/${locationId}/rooms`);
  }
}