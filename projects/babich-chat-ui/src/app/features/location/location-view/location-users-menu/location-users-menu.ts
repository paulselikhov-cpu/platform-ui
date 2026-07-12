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
} from '@angular/core';
import { Overlay, OverlayRef, ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { ILocationUser, UserPresenceFilter } from '../../../../models/location/location.interface';
import { LocationService } from '../../../../services/http-services/location.service';
import { timeAgo } from './test/mock';

type SearchMode = 'room' | 'user';

interface RoomGroup {
  roomId: number;
  roomName: string;
  users: ILocationUser[];
}

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
  private locationService = inject(LocationService);
  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);

  triggerRef = viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');

  locationId = input.required<number>();
  isOpen = signal(false);

  searchMode = signal<SearchMode>('room');
  presenceFilter = signal<UserPresenceFilter>('all');
  searchQuery = signal('');

  // накопленный список — пополняется по мере подгрузки страниц
  loadedUsers = signal<ILocationUser[]>([]);
  currentPage = signal(0);
  hasMore = signal(true);
  loading = signal(false);      // первая загрузка / смена фильтра-поиска
  loadingMore = signal(false);  // подгрузка следующей страницы при скролле

  onlineCountTotal = signal(0); // счётчик на кнопке — считаем отдельным лёгким запросом ниже, либо оставляем по факту загруженных

  collapsedRooms = signal<Set<number>>(new Set());

  // группировка по комнатам поверх уже загруженных страниц (не влияет на пагинацию с бэка)
  roomGroups = computed<RoomGroup[]>(() => {
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

  offlineUsers = computed<ILocationUser[]>(() => this.loadedUsers().filter((u) => !u.online));

  isEmpty = computed(
    () => !this.loading() && this.roomGroups().length === 0 && this.offlineUsers().length === 0
  );

  private overlayRef: OverlayRef | null = null;
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;

  toggle() {
    if (this.isOpen()) {
      this.closeOverlay();
    } else {
      this.openOverlay();
    }
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

  setSearchMode(mode: SearchMode) {
    if (this.searchMode() === mode) return;
    this.searchMode.set(mode);
    this.resetAndLoad(); // режим поиска влияет на то, что ищет query — перезагружаем
  }

  setPresenceFilter(filter: UserPresenceFilter) {
    if (this.presenceFilter() === filter) return;
    this.presenceFilter.set(filter);
    this.resetAndLoad();
  }

  onSearchInput(value: string) {
    this.searchQuery.set(value);

    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
    this.searchDebounceTimer = setTimeout(() => this.resetAndLoad(), SEARCH_DEBOUNCE_MS);
  }

  toggleRoomCollapse(roomId: number) {
    const next = new Set(this.collapsedRooms());
    if (next.has(roomId)) next.delete(roomId);
    else next.add(roomId);
    this.collapsedRooms.set(next);
  }

  isRoomCollapsed(roomId: number): boolean {
    return this.collapsedRooms().has(roomId);
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

  initial(name: string): string {
    return name.charAt(0).toUpperCase();
  }

  formatLastSeen(isoDate: string | null): string {
    return isoDate ? timeAgo(isoDate) : '';
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

  ngOnDestroy() {
    this.overlayRef?.dispose();
    if (this.searchDebounceTimer) clearTimeout(this.searchDebounceTimer);
  }
}