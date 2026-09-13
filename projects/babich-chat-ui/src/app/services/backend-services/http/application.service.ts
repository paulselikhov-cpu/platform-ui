import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IApplication } from '../../../models/economy/application.interface';

/** Гражданские заявки персонажа (покупка первой локации, паспорт и т.д.). */
@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/applications');

  /** Подать заявку на покупку первой локации (для бомжей). */
  buyFirstLocation(payload: { locationName: string; locationDescription: string }): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/buy-first-location`, payload);
  }

  registerPassport(): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/register-passport`, null);
  }

  registerWorkLicence(): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/register-work-licence`, null);
  }

  /** Одобрить заявку сотрудником мэрии (ADMIN/MODERATOR). */
  approveApplication(applicationId: number): Observable<IApplication> {
    return this.http.post<IApplication>(`${this.baseUrl()}/${applicationId}/approve`, null);
  }

  /** Отклонить заявку сотрудником мэрии (ADMIN/MODERATOR). */
  rejectApplication(id: number, reason?: string): Observable<IApplication> {
    const base = `${this.baseUrl()}/${id}/reject`;
    if (reason) {
      return this.http.post<IApplication>(base, null, { params: { reason } });
    }
    return this.http.post<IApplication>(base, null);
  }

  /** Получить все мои заявки. */
  getMyApplications(): Observable<IApplication[]> {
    return this.http.get<IApplication[]>(`${this.baseUrl()}/my`);
  }

  /** Все гражданские заявки (для модератора/сотрудника мэрии). */
  getAllApplications(): Observable<IApplication[]> {
    return this.http.get<IApplication[]>(`${this.baseUrl()}/all`);
  }
}
