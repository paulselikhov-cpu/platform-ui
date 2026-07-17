import { HttpClient } from '@angular/common/http';
import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Subscription, Observable, tap, map, of } from 'rxjs';
import { StompConnectionService } from '../../base/stomp-connection.service';
import { LocationMembersService } from '../http/location-members.service';
import { IUnreadUpdateEvent } from '../../../../models/messages/unread/unread.interface';
import { AuthService } from '../../base/auth.service';

@Injectable({ providedIn: 'root' })
export class UnreadTrackingSidebarService {
  private readonly auth = inject(AuthService);  
  // locationId -> суммарный unread по всей локации (для бейджа в сайдбаре)
  private readonly totals = signal<Map<number, number>>(new Map());
  // locationId -> (roomId -> unread) — для бейджей в списке комнат
  private readonly perRoom = signal<Map<number, Map<number, number>>>(new Map());

  private queueSub: Subscription | null = null;
  private trackedIds = new Set<number>();

  constructor(
    private http: HttpClient,
    private locationMembersService: LocationMembersService,
    private stomp: StompConnectionService,
  ) {}

  /** Вызывается один раз списком локаций сайдбара при их загрузке — как online-tracking. */
  track(locationIds: number[]): Observable<Map<number, number>> {
    console.log('track')
    locationIds.forEach(id => this.trackedIds.add(id));
    this.ensureQueueSubscribed();

    const characterId = this.auth.currentUser()?.userId;
    if (!characterId) return of(this.totals()); // нет юзера — нечего грузить

    return this.locationMembersService.getUnreadCounts(locationIds, characterId).pipe(
      tap(record => {
        this.totals.update(prev => {
          const next = new Map(prev);
          Object.entries(record).forEach(([id, count]) => next.set(+id, count));
          return next;
        });
      }),
      map(() => this.totals()),
    );
  }

  totalFor(locationId: number): Signal<number> {
    return computed(() => this.totals().get(locationId) ?? 0);
  }

  roomCountFor(locationId: number, roomId: number): Signal<number> {
    return computed(() => this.perRoom().get(locationId)?.get(roomId) ?? 0);
  }

  /** Разбивка по комнатам грузится по требованию — когда юзер открыл конкретную локацию
   *  (в сайдбаре достаточно total, разбивка нужна только в открытом room-list). */
  loadRoomBreakdown(locationId: number, characterId: number): void {
    this.locationMembersService.getUnreadSummary(locationId, characterId).subscribe(summary => {
      const roomMap = new Map<number, number>(
        Object.entries(summary.unreadByRoomId).map(([id, count]) => [+id, count])
      );
      this.perRoom.update(prev => {
        const next = new Map(prev);
        next.set(locationId, roomMap);
        return next;
      });
      this.totals.update(prev => {
        const next = new Map(prev);
        next.set(locationId, summary.total);
        return next;
      });
    });
  }

  // unread-tracking-sidebar.service.ts (аналогично для online)
  private ensureQueueSubscribed() {
    if (this.queueSub) return;

    this.queueSub = this.stomp
      .topic<IUnreadUpdateEvent>('/user/queue/unread-updates')
      .subscribe(event => this.applyEvent(event));

    // самокоррекция дрифта: при каждом реконнекте — перезапросить свежий снапшот
    this.stomp.onConnect(() => {
      if (this.trackedIds.size > 0) {
        const characterId = this.auth.currentUser()?.userId;
        if (characterId) this.refetchSnapshot(Array.from(this.trackedIds), characterId);
      }
    });
  }

  private refetchSnapshot(locationIds: number[], characterId: number) {
    this.locationMembersService.getUnreadCounts(locationIds, characterId).subscribe(record => {
      this.totals.update(prev => {
        const next = new Map(prev);
        Object.entries(record).forEach(([id, count]) => next.set(+id, count));
        return next;
      });
    });
  }

  private applyEvent(event: IUnreadUpdateEvent) {
    if (!this.trackedIds.has(event.locationId)) return;

    const characterId = this.auth.currentUser()?.userId; // всегда актуальный, не кешированный
    if (!this.perRoom().has(event.locationId) && characterId) {
      this.loadRoomBreakdown(event.locationId, characterId);
      return;
    }

    this.perRoom.update(prev => {
      const next = new Map(prev);
      const roomMap = new Map(next.get(event.locationId) ?? new Map());
      roomMap.set(event.roomId, event.roomUnreadCount);
      next.set(event.locationId, roomMap);
      return next;
    });

    // пересчитываем total локации по актуальной карте комнат
    const roomMap = this.perRoom().get(event.locationId);
    const sum = roomMap ? Array.from(roomMap.values()).reduce((a, b) => a + b, 0) : 0;
    this.totals.update(prev => {
      const next = new Map(prev);
      next.set(event.locationId, sum);
      return next;
    });
  }
}