import { distinctUntilChanged, map, Observable, shareReplay } from "rxjs";
import { IPresenceEvent } from "../../../../models/presence/presence.interface";
import { Injectable } from "@angular/core";
import { StompConnectionService } from "../../../../services/backend-services/base/stomp-connection.service";
import { LocationMembersService } from "../../../../services/backend-services/http/location-members.service";

export interface LocationPresenceState {
  onlineIds: Set<number>;
  event: IPresenceEvent | null; // null — это применение снапшота, иначе — конкретный online/offline
}

@Injectable({ providedIn: 'root' })
export class OnlineTrackingService {
  private readonly cache = new Map<number, Observable<LocationPresenceState>>();

  constructor(
    private locationMembersService: LocationMembersService,
    private stomp: StompConnectionService,
  ) {}

  getPresence$(locationId: number): Observable<LocationPresenceState> {
  let stream$ = this.cache.get(locationId);
  if (stream$) {
    console.log(`[Presence] переиспользуем существующий поток для локации ${locationId}, всего в кеше: ${this.cache.size}`);
    return stream$;
  }

  console.log(`[Presence] создаём НОВЫЙ поток для локации ${locationId}, будет в кеше: ${this.cache.size + 1}`);

  stream$ = new Observable<LocationPresenceState>(subscriber => {
    console.log(`[Presence] WS: подписываемся на /topic/location.${locationId}.presence`);

    let snapshotApplied = false;
    let currentIds = new Set<number>();
    const buffered: IPresenceEvent[] = [];

    const presenceSub = this.stomp
      .topic<IPresenceEvent>(`/topic/location.${locationId}.presence`)
      .subscribe(event => {
        if (!snapshotApplied) {
          console.log(`[Presence] локация ${locationId}: событие получено ДО снапшота, буферизуем`, event);
          buffered.push(event);
          return;
        }
        currentIds = applyEvent(currentIds, event);
        subscriber.next({ onlineIds: new Set(currentIds), event });
      });

    const snapshotSub = this.locationMembersService
      .getOnlineCharacterIds(locationId)
      .subscribe(ids => {
        console.log(`[Presence] локация ${locationId}: снапшот получен, id онлайн:`, ids);
        currentIds = new Set(ids);
        subscriber.next({ onlineIds: new Set(currentIds), event: null });

        buffered.forEach(e => {
          currentIds = applyEvent(currentIds, e);
          subscriber.next({ onlineIds: new Set(currentIds), event: e });
        });
        buffered.length = 0;
        snapshotApplied = true;
      });

    return () => {
      console.log(`[Presence] WS: отписываемся от /topic/location.${locationId}.presence (последний подписчик ушёл)`);
      presenceSub.unsubscribe();
      snapshotSub.unsubscribe();
      this.cache.delete(locationId);
    };
  }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

  this.cache.set(locationId, stream$);
  return stream$;
}

  /** Для простых потребителей, которым нужен только Set id */
  getOnlineIds$(locationId: number): Observable<Set<number>> {
    return this.getPresence$(locationId).pipe(
      map(state => state.onlineIds),
      distinctUntilChanged(setsEqual),
    );
  }
}

function applyEvent(ids: Set<number>, event: IPresenceEvent): Set<number> {
  const next = new Set(ids);
  event.online ? next.add(event.characterId) : next.delete(event.characterId);
  return next;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  return a.size === b.size && [...a].every(id => b.has(id));
}