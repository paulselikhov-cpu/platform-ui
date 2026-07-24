import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { District } from '../../../models/district/district.interface';
import { PublicLocation } from '../../../models/district/public-location.interface';

/**
 * Сервис для работы с API районов и их системных локаций.
 */
@Injectable({
  providedIn: 'root'
})
export class DistrictService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/districts');

  /**
   * Получить список всех районов
   */
  getAllDistricts(): Observable<District[]> {
    return this.http.get<District[]>(this.baseUrl());
  }

  /**
   * Получить район по ID со списком его системных локаций
   */
  getDistrictById(id: number): Observable<District> {
    return this.http.get<District>(`${this.baseUrl()}/${id}`);
  }

  /**
   * Получить только системные локации конкретного района
   */
  getPublicLocations(districtId: number): Observable<PublicLocation[]> {
    return this.http.get<PublicLocation[]>(`${this.baseUrl()}/${districtId}/public-locations`);
  }
}
