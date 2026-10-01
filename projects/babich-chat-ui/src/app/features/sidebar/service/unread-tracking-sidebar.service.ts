import { computed, inject, Injectable, signal, Signal } from '@angular/core';
import { Subscription, Observable, tap, map, of } from 'rxjs';
import { StompConnectionService } from '../../../services/backend-services/base/stomp-connection.service';
import { IUnreadUpdateEvent } from '../../../models/messages/unread/unread.interface';
import { AuthService } from '../../../services/backend-services/base/auth.service';
import { LocationUsersService } from '../../../services/backend-services/http/location-users.service';

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
    private locationUsersService: LocationUsersService,
    private stomp: StompConnectionService,
  ) {
    this.ensureQueueSubscribed();
  }

  /** Вызывается один раз списком локаций сайдбара при их загрузке — как online-tracking. */
  track(locationIds: number[]): Observable<Map<number, number>> {
    locationIds.forEach(id => this.trackedIds.add(id));

    const characterId = this.auth.currentUser()?.userId;
    if (!characterId) return of(this.totals()); // нет юзера — нечего грузить

    return this.locationUsersService.getUnreadCounts(locationIds, characterId).pipe(
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

  /**
   * Вся разбивка по комнатам локации одним сигналом — для списка комнат.
   * Чтение по одному значению на комнату в `@for` не подходит: на каждую
   * итерацию пришлось бы создавать свой computed.
   */
  roomCountsFor(locationId: number): Signal<Map<number, number>> {
    return computed(() => this.perRoom().get(locationId) ?? new Map());
  }

  /** Разбивка по комнатам грузится по требованию — когда юзер открыл конкретную локацию
   *  (в сайдбаре достаточно total, разбивка нужна только в открытом room-list). */
  loadRoomBreakdown(locationId: number, characterId: number): void {
    this.trackedIds.add(locationId); // локация открыта deep-link'ом — сайдбар её не отдавал
    this.locationUsersService.getUnreadSummary(locationId, characterId).subscribe(summary => {
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
    let isFirstConnect = true;
    this.stomp.onConnect(() => {
      if (isFirstConnect) {
        isFirstConnect = false; // пропускаем начальный коннект — снапшот уже грузит track()
        return;
      }
      if (this.trackedIds.size > 0) {
        const characterId = this.auth.currentUser()?.userId;
        if (characterId) this.refetchSnapshot(Array.from(this.trackedIds), characterId);
      }
    });
  }

  private refetchSnapshot(locationIds: number[], characterId: number) {
    this.locationUsersService.getUnreadCounts(locationIds, characterId).subscribe(record => {
      this.totals.update(prev => {
        const next = new Map(prev);
        Object.entries(record).forEach(([id, count]) => next.set(+id, count));
        return next;
      });
    });
  }

  private applyEvent(event: IUnreadUpdateEvent) {
    const characterId = this.auth.currentUser()?.userId; // всегда актуальный, не кешированный

    // Локация известна сервису либо из сайдбара (track), либо из загруженной
    // разбивки — deep-link открывает локацию вообще без рендера app-sidebar.
    const isTracked = this.trackedIds.has(event.locationId) || this.perRoom().has(event.locationId);
    if (!isTracked) return;

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