import { HttpClient } from "@angular/common/http";
import { computed, Injectable, signal, Signal } from "@angular/core";
import { Subscription, Observable, tap, map } from "rxjs";
import { StompConnectionService } from "../../../services/backend-services/base/stomp-connection.service";

export interface LocationPresenceCountEvent {
  locationId: number;
  online: boolean;
}

@Injectable({ providedIn: 'root' })
export class OnlineTrackingSidebarService {
  private readonly counts = signal<Map<number, number>>(new Map());
  private globalTopicSub: Subscription | null = null;
  private trackedIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private stomp: StompConnectionService,
  ) {}

  /** Вызывается один раз списком локаций сайдбара при их загрузке. */
  track(locationIds: number[]): Observable<Map<number, number>> {
    locationIds.forEach(id => this.trackedIds.add(id));

    this.ensureGlobalTopicSubscribed();

    return this.http
      .get<Record<string, number>>('/api/location-users/online-counts', {
        params: { locationIds: locationIds.join(',') },
      })
      .pipe(
        tap(record => {
          this.counts.update(prev => {
            const next = new Map(prev);
            Object.entries(record).forEach(([id, count]) => next.set(+id, count));
            return next;
          });
        }),
        map(() => this.counts()),
      );
  }

  countFor(locationId: number): Signal<number> {
    return computed(() => this.counts().get(locationId) ?? 0);
  }

  // online-tracking-sidebar.service.ts
  private ensureGlobalTopicSubscribed() {
    if (this.globalTopicSub) return;

    this.globalTopicSub = this.stomp
      .topic<LocationPresenceCountEvent>('/topic/locations.presence-counts')
      .subscribe(event => {
        if (!this.trackedIds.has(event.locationId)) return;
        this.counts.update(prev => {
          const next = new Map(prev);
          const current = next.get(event.locationId) ?? 0;
          next.set(event.locationId, Math.max(0, current + (event.online ? 1 : -1)));
          return next;
        });
      });

    // самокоррекция дрифта — при каждом (пере)подключении перезапрашиваем
    // авторитетные числа с бэка, а не доверяем накопленной арифметике вечно
    let isFirstConnect = true;
    this.stomp.onConnect(() => {
      if (isFirstConnect) {
        isFirstConnect = false; // пропускаем начальный коннект — снапшот уже грузит track()
        return;
      }
      if (this.trackedIds.size > 0) {
        this.http.get<Record<string, number>>('/api/location-users/online-counts', {
          params: { locationIds: Array.from(this.trackedIds).join(',') },
        }).subscribe(record => {
          this.counts.update(prev => {
            const next = new Map(prev);
            Object.entries(record).forEach(([id, count]) => next.set(+id, count));
            return next;
          });
        });
      }
    });
  }
}