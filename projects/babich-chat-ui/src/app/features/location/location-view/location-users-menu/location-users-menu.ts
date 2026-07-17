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
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { RoomGroup, SearchMode } from './models/location-users.menu.interface';
import { timeAgo } from './helpers/location-users-menu.helper';
import { Subscription, switchMap } from 'rxjs';
import { ACCENT_PALETTE, PAGE_SIZE, SCROLL_THRESHOLD_PX, SEARCH_DEBOUNCE_MS } from './constants/location-users-menu.constant';
import { hashToIndex } from '../../../../shared/utils/system.utils';
import { ILocationUser, UserPresenceFilter } from '../../../../models/location-members/location-members.interface';
import { IPresenceEvent } from '../../../../models/presence/presence.interface';
import { IRoom } from '../../../../models/location/location.interface';
import { LocationPresenceState } from '../services/online-tracking.service';
import { LocationMembersService } from '../../../../services/backend-services/http/location-members.service';

@Component({
  selector: 'app-location-users-menu',
  imports: [],
  templateUrl: './location-users-menu.html',
  styleUrl: './location-users-menu.scss',
})
export class LocationUsersMenu implements OnDestroy {
  readonly locationId = input.required<number>();
  readonly rooms = input.required<IRoom[]>();
  readonly onlineState = input.required<LocationPresenceState | null>();

  //Общее
  private readonly locationMembersService = inject(LocationMembersService);
  private readonly overlay = inject(Overlay);
  private readonly isOpen = signal(false);
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  //Ref
  private readonly triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  readonly searchMode = signal<SearchMode>('user');
  readonly presenceFilter = signal<UserPresenceFilter>('all');
  readonly searchQuery = signal('');

  //Онлайн-каунтер
  readonly onlineIds = computed(() => this.onlineState()?.onlineIds ?? new Set<number>());
  readonly onlineCountTotal = computed(() => this.onlineIds().size);

  //Накопленный список — пополняется по мере подгрузки страниц
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
  readonly filteredRoomGroups = computed<RoomGroup[]>(() => {
    const groups = this.roomGroups();

    if (this.searchMode() !== 'room') return groups;

    const query = this.searchQuery().trim().toLowerCase();
    if (!query) return groups;

    // rooms() — источник правды по названиям комнат на случай,
    // если у уже загруженных пользователей roomName ещё не резолвился
    return groups.filter((g) => {
      const roomName = this.rooms().find((r) => r.id === g.roomId)?.name ?? g.roomName;
      return roomName.toLowerCase().includes(query);
    });
  });
  readonly offlineUsers = computed<ILocationUser[]>(() => this.loadedUsers().filter((u) => !u.online));
  readonly visibleOfflineUsers = computed<ILocationUser[]>(() => this.searchMode() === 'room' ? [] : this.offlineUsers());
  readonly isEmpty = computed(
    () => !this.loading() && this.filteredRoomGroups().length === 0 && this.visibleOfflineUsers().length === 0
  );

 constructor() {
    effect(() => {
      const state = this.onlineState();
      if (state?.event) {
        this.updateLocationUsersMenu(state.event);
      }
    });
  }

private updateLocationUsersMenu(event: IPresenceEvent) {
  this.loadedUsers.update(users => {
    const index = users.findIndex(u => u.characterId === event.characterId);
    if (index === -1) return users;

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
  // this.trackedOnlineIds.update(...) — больше не нужно, счётчик идёт из onlineIds computed
}

  private resolveRoomName(roomId: number | null): string | null {
    if (roomId == null) return null;
    return this.rooms().find(u => u.id === roomId)?.name ?? `Комната #${roomId}`;
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

    this.locationMembersService
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

    const query = this.searchQuery().trim();
    const prevBackendQuery = this.searchMode() === 'user' ? query : '';
    const nextBackendQuery = mode === 'user' ? query : '';

    this.searchMode.set(mode);

    // перезапрашиваем с бэка только если реально меняется то, что мы туда шлём —
    // переход room -> user с непустым запросом. Пустая строка и её отсутствие
    // считаются одним и тем же состоянием ("без фильтра")
    if (prevBackendQuery !== nextBackendQuery) {
      this.resetAndLoad();
    }
  }

  onSetPresenceFilter(filter: UserPresenceFilter) {
    if (this.presenceFilter() === filter) return;
    this.presenceFilter.set(filter);
    this.resetAndLoad();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);

    if (this.searchMode() === 'room') {
      // поиск по комнате — чистая клиентская фильтрация уже загруженных данных,
      // поход на бэк не нужен
      if (this.searchDebounceTimer) {
        clearTimeout(this.searchDebounceTimer);
        this.searchDebounceTimer = null;
      }
      return;
    }

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
  }
}