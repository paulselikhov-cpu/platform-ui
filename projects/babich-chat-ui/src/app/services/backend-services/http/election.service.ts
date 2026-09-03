import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  IElectionOverview,
  IPoll,
  IPollCandidate,
  IPollVote,
} from '../../../models/poll/election.interface';

@Injectable({ providedIn: 'root' })
export class ElectionService {
  private http = inject(HttpClient);
  private baseUrl = '/api/elections';

  /** Шаг 1: выдвинуть кандидатуру и начать выборы губернатора в районе. */
  initiate(districtId: number): Observable<IPoll> {
    return this.http.post<IPoll>(`${this.baseUrl}/initiate`, null, {
      params: { districtId },
    });
  }

  /** Шаг 2: стать кандидатом в идущих выборах. */
  join(pollId: number): Observable<IPollCandidate> {
    return this.http.post<IPollCandidate>(`${this.baseUrl}/${pollId}/join`, null);
  }

  /** Шаг 3: проголосовать за кандидата. */
  vote(pollId: number, candidateId: number): Observable<IPollVote> {
    return this.http.post<IPollVote>(`${this.baseUrl}/${pollId}/vote`, null, {
      params: { candidateId },
    });
  }

  getStatus(pollId: number): Observable<IPoll> {
    return this.http.get<IPoll>(`${this.baseUrl}/${pollId}`);
  }

  /** Досрочно завершить выборы (админ/действие): подсчёт голосов + результат. */
  close(pollId: number): Observable<IPoll> {
    return this.http.post<IPoll>(`${this.baseUrl}/${pollId}/close`, null);
  }

  getCandidates(pollId: number): Observable<IPollCandidate[]> {
    return this.http.get<IPollCandidate[]>(`${this.baseUrl}/${pollId}/candidates`);
  }

  /** Состояние выборов района для мини-таблицы на Площади Ленина. */
  getOverview(districtId: number): Observable<IElectionOverview> {
    return this.http.get<IElectionOverview>(`${this.baseUrl}/district/${districtId}/overview`);
  }
}
