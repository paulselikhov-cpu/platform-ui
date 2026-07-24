import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IWorkResult } from '../../../models/economy/work-result.interface';

/**
 * Тап-фарм работы персонажа. В MVP доступна только профессия дворника.
 */
@Injectable({ providedIn: 'root' })
export class WorkService {
  private http = inject(HttpClient);
  private baseUrl = signal('/api/work');

  workAsDvornik(): Observable<IWorkResult> {
    return this.http.post<IWorkResult>(`${this.baseUrl()}/dvornik`, {});
  }
}
