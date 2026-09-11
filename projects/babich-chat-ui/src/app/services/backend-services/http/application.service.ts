import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApplication } from '../../../models/economy/application.interface';

/**
 * Гражданские заявки персонажа (покупка первой локации и т.д.).
 */
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/applications');

  /**
   * Подать заявку на покупку первой локации (для бомжей).
   * Требования: gameStatus = HOMELESS, coinBalance >= 1000.
   */
  buyFirstLocation(payload: { locationName: string; locationDescription: string }): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/buy-first-location`, payload);
  }

  registerPassport(): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/register-passport`, null);
  } 

  /**
   * Получить все мои заявки.
   */
  getMyApplications(): Observable<IApplication[]> {
    return this.http.get<IApplication[]>(`${this.baseUrl()}/my`);
  }
}
