import {
  Component,
  input,
  inject,
  signal,
  computed,
  ElementRef,
  viewChild,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  effect,
  untracked,
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ILocationUser, IPresenceEvent, UserPresenceFilter } from '../../../../models/location/location.interface';
import { LocationService } from '../../../../services/http-services/location.service';
import { ChatWebSocketService } from '../../../../services/chat-websocket.service';
import { Subscription } from 'rxjs';
import { RoomGroup, SearchMode } from './models/location-users.menu.interface';
import { timeAgo } from './helpers/location-users-menu.helper';



const ACCENT_PALETTE = ['#7C9EF0', '#F0A15A', '#6FCF97', '#E17FB8', '#5CC9C9', '#D4A24C'];
const PAGE_SIZE = 20;
const SCROLL_THRESHOLD_PX = 80;
const SEARCH_DEBOUNCE_MS = 300;

function hashToIndex(text: string, modulo: number): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % modulo;
}

@Component({
  selector: 'app-location-users-menu',
  imports: [],
  templateUrl: './location-users-menu.html',
  styleUrl: './location-users-menu.scss',
})
export class LocationUsersMenu implements OnDestroy {
  readonly locationId = input.required<number>();

  //Общее
  private readonly locationService = inject(LocationService);
  private readonly overlay = inject(Overlay);
  private readonly isOpen = signal(false);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  //Ref
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;


  readonly searchMode = signal<SearchMode>('room');
  readonly presenceFilter = signal<UserPresenceFilter>('all');
  readonly searchQuery = signal('');

  //реалтам слушатель сообщений
  private readonly chatService = inject(ChatWebSocketService);
  private readonly trackedOnlineIds = signal<Set<number>>(new Set());
  private presenceSubscription: Subscription | null = null;
  readonly onlineCountTotal = computed(() => this.trackedOnlineIds().size);

  // накопленный список — пополняется по мере подгрузки страниц
  readonly loadedUsers = signal<ILocationUser[]>([]);
  readonly currentPage = signal(0);
  readonly hasMore = signal(true);
  readonly loading = signal(false);      // первая загрузка / смена фильтра-поиска
  readonly loadingMore = signal(false);  // подгрузка следующей страницы при скролле

  readonly collapsedRooms = signal<Set<number>>(new Set());

  // группировка по комнатам поверх уже загруженных страниц (не влияет на пагинацию с бэка)
  readonly roomGroups = computed<RoomGroup[]>(() => {
    const groupsMap = new Map<number, RoomGroup>();
    for (const u of this.loadedUsers()) {
      if (!u.online || u.roomId == null) continue;
      if (!groupsMap.has(u.roomId)) {
        groupsMap.set(u.roomId, { roomId: u.roomId, roomName: u.roomName!, users: [] });
      }
      groupsMap.get(u.roomId)!.users.push(u);
    }
    return Array.from(groupsMap.values()).sort((a, b) => a.roomName.localeCompare(b.roomName));
  });
  readonly offlineUsers = computed<ILocationUser[]>(() => this.loadedUsers().filter((u) => !u.online));
  readonly isEmpty = computed(
    () => !this.loading() && this.roomGroups().length === 0 && this.offlineUsers().length === 0
  );

  constructor() {
    effect(() => {
      const isConnected = this.chatService.currentUserPresence(); // подписываемся на сигнал
      if (!isConnected) return;
      const locationId = untracked(() => this.locationId());
      this.locationService.getOnlineCharacterIds(locationId).subscribe({
        next: ids => {
          this.trackedOnlineIds.update(current => new Set([...current, ...ids]))
          this.subscribeToPresence(this.locationId())
        },
        error: err => console.error('getOnlineCharacterIds fetch failed', err),
      });
    });


  }

  private subscribeToPresence(locationId: number) {
    this.presenceSubscription = this.chatService
      .subscribeToTopic<IPresenceEvent>(`/topic/location.${locationId}.presence`)
      .subscribe(event => this.applyPresenceEvent(event));
  }

    /** Точечно обновляет уже загруженный список и счётчик — без похода на бэк на каждое событие. */
  private applyPresenceEvent(event: IPresenceEvent) {
      this.trackedOnlineIds.update(ids => {
        debugger
        if (ids.has(event.characterId) === event.online) return ids; // уже в нужном состоянии — no-op, счётчик не трогаем
        const next = new Set(ids);
        if (event.online) next.add(event.characterId);
        else next.delete(event.characterId);
        return next;
      });


    this.loadedUsers.update(users => {
      const index = users.findIndex(u => u.characterId === event.characterId);
      if (index === -1) return users; // юзер не в текущей загруженной странице — просто пропускаем

      const updated = [...users];
      updated[index] = {
        ...updated[index],
        online: event.online,
        roomId: event.online ? event.roomId : null,
        roomName: event.online ? this.resolveRoomName(event.roomId) : null,
        lastSeenAt: event.online ? null : new Date().toISOString(),
      };
      return updated;
    });
  }

  private resolveRoomName(roomId: number | null): string | null {
    if (roomId == null) return null;
    return this.loadedUsers().find(u => u.roomId === roomId)?.roomName ?? `Комната #${roomId}`;
  }

  private openOverlay() {
    this.resetAndLoad();

    const positions: ConnectedPosition[] = [
      { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 8 },
      { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -8 },
      { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 },
      { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 },
    ];

    const positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.triggerRef())
      .withPositions(positions)
      .withPush(true)
      .withViewportMargin(8);

    this.overlayRef = this.overlay.create({
      positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      hasBackdrop: true,
      backdropClass: 'users-menu-backdrop',
    });

    const portal = new TemplatePortal(this.panelTemplate(), this.viewContainerRef);
    this.overlayRef.attach(portal);
    this.isOpen.set(true);

    this.overlayRef.backdropClick().subscribe(() => this.closeOverlay());
    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === 'Escape') this.closeOverlay();
    });
  }

  private closeOverlay() {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.isOpen.set(false);
  }

  private resetAndLoad() {
    this.currentPage.set(0);
    this.hasMore.set(true);
    this.loadedUsers.set([]);
    this.loading.set(true);
    this.fetchPage(0);
  }

  private loadNextPage() {
    const nextPage = this.currentPage() + 1;
    this.loadingMore.set(true);
    this.fetchPage(nextPage);
  }

  private fetchPage(page: number) {
    const query = this.searchQuery().trim() || undefined;

    // "поиск по комнате" — фильтруем клиентские группы после подгрузки,
    // но на бэк всё равно шлём query по имени персонажа только в режиме "user";
    // в режиме "room" ищем среди уже загруженных страниц (комнат обычно немного,
    // не имеет смысла городить отдельный бэк-эндпоинт под поиск комнат)
    const backendQuery = this.searchMode() === 'user' ? query : undefined;

    this.locationService
      .getLocationUsers(this.locationId(), {
        query: backendQuery,
        filter: this.presenceFilter(),
        page,
        size: PAGE_SIZE,
      })
      .subscribe({
        next: (result) => {
          this.loadedUsers.update((prev) => [...prev, ...result.items]);
          this.hasMore.set(result.hasMore);
          this.currentPage.set(page);
          this.loading.set(false);
          this.loadingMore.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.loadingMore.set(false);
        },
      });
  }

  onToggle() {
    if (this.isOpen()) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
  }

  onSetSearchMode(mode: SearchMode) {
    if (this.searchMode() === mode) return;
    this.searchMode.set(mode);
    this.resetAndLoad(); // режим поиска влияет на то, что ищет query — перезагружаем
  }

  onSetPresenceFilter(filter: UserPresenceFilter) {
    if (this.presenceFilter() === filter) return;
    this.presenceFilter.set(filter);
    this.resetAndLoad();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);

    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => this.resetAndLoad(), SEARCH_DEBOUNCE_MS);
  }

  onToggleRoomCollapse(roomId: number) {
    const next = new Set(this.collapsedRooms());
    if (next.has(roomId)) next.delete(roomId);
    else next.add(roomId);
    this.collapsedRooms.set(next);
  }

  // подгрузка следующей страницы при приближении к низу списка
  onListScroll(event: Event) {
    if (this.loadingMore() || !this.hasMore()) return;

    const el = event.target as HTMLElement;
    const distanceToBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceToBottom < SCROLL_THRESHOLD_PX) {
      this.loadNextPage();
    }
  }

  avatarColor(name: string): string {
    return ACCENT_PALETTE[hashToIndex(name, ACCENT_PALETTE.length)];
  }

  roomColor(roomId: number): string {
    return ACCENT_PALETTE[hashToIndex(String(roomId), ACCENT_PALETTE.length)];
  }

  isRoomCollapsed(roomId: number): boolean {
    return this.collapsedRooms().has(roomId);
  }

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  formatLastSeen(isoDate: string | null): string {
    return isoDate ? timeAgo(isoDate) : '';
  }

  ngOnDestroy() {
    this.overlayRef?.dispose();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.presenceSubscription?.unsubscribe();
    this.presenceSubscription?.unsubscribe();
  }
}