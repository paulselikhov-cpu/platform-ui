import { Injectable, Injector, OnDestroy, OnInit, effect, inject, signal, computed, untracked } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { LocationFeature } from '../../features/location-feature/location-feature.interface';
import { LocationFeatureStore } from '../../features/location-feature/location-feature.store';
import { LocationService } from '../../services/backend-services/http/location.service';
import { CurrentChatUserService } from '../../services/current-chat-user.service';
import { IChatUser } from '../../models/chatUser/chatUser.interface';
import { ILocation, IRoom } from '../../models/location/location.interface';
import { RoomMenuItem } from '../../shared/components/actions-menu/room-menu-item.interface';

/** Что открыто в основной панели: пусто / локация / создание / поиск / работы. */
export type ChatPanel = 'empty' | 'location' | 'create' | 'find' | 'work' | 'district' | 'profile' | 'settings';

/** Вкладка мобильной навигации; соответствует группе пунктов `NavGroup`. */
export type MobileTab = 'locations' | 'district' | 'profile';

/** Что показывает левая панель: список локаций или список комнат выбранной локации. */
export type SidebarMode = 'locations' | 'rooms';

/**
 * Состояние сессии чата: переводит URL в открытую локацию/комнату/раздел и
 * обратно — в переходы роутера. Не содержит разметки, поэтому одинаково
 * обслуживает и десктопную, и мобильную раскладку.
 *
 * Область видимости: `ChatShell` объявляет этот класс в `providers`, поэтому
 * экземпляр живёт ровно столько же, сколько роутируемый компонент. Это важно:
 * `ActivatedRoute` дочернего маршрута (с параметрами `code`/`roomId`) инъектится
 * только в этом контексте, а при выходе из локации состояние должно сбрасываться.
 * Состояние самой фичи локации переживает пересоздание шелла — за это отвечает
 * корневой `LocationFeatureStore`.
 */
@Injectable()
export class ChatShellState implements OnDestroy {

  private readonly locationService = inject(LocationService);
  private readonly currentChatUserService = inject(CurrentChatUserService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);
  private readonly featureStore = inject(LocationFeatureStore);

  private readonly initialPage = (this.route.snapshot.data?.['page'] as ChatPanel) ?? 'empty';
  private readonly initialLocation =
    this.initialPage === 'location' &&
    this.featureStore.currentLocation?.code === String(this.route.snapshot.params?.['code'])
      ? this.featureStore.currentLocation
      : null;
  private readonly initialRoom =
    this.initialLocation && this.route.snapshot.params?.['roomId'] != null
      ? this.featureStore.currentRoom
      : null;

  readonly selectedLocation = signal<ILocation | null>(this.initialLocation);
  readonly selectedRoom = signal<IRoom | null>(this.initialRoom);
  /** id активного раздела фичи локации (роут `.../feature/:featureId`); null — не в разделе. */
  readonly selectedFeatureId = signal<string | null>(null);
  /** Фича текущей локации (создаётся здесь — состояние живёт, пока открыта локация). */
  readonly locationFeature = signal<LocationFeature | null>(null);
  readonly panel = signal<ChatPanel>(this.initialPage);
  readonly locationLoading = signal(this.initialPage === 'location');
  private readonly locationLoadAttempt = signal(0);
  private readonly visibleLocationLoadAttempt = signal<number | null>(null);
  readonly showLocationLoading = computed(
    () =>
      this.locationLoading() &&
      this.visibleLocationLoadAttempt() === this.locationLoadAttempt(),
  );
  readonly sidebarMode = signal<SidebarMode>(
    this.initialPage === 'location' ? 'rooms' : 'locations',
  );
  readonly rooms = signal<IRoom[]>([]);

  /**
   * Активная вкладка мобильной навигации — из `data.tab` маршрута.
   * Хранится в URL, а не в компоненте: вкладка переживает F5 и работает
   * как deep-link, поэтому мобильный экран открывается по прямой ссылке.
   */
  readonly tab = signal<MobileTab>('locations');

  constructor() {
    effect((onCleanup) => {
      const attempt = this.locationLoadAttempt();
      if (!this.locationLoading()) {
        this.visibleLocationLoadAttempt.set(null);
        return;
      }

      this.visibleLocationLoadAttempt.set(null);
      const timeoutId = setTimeout(
        () => this.visibleLocationLoadAttempt.set(attempt),
        200,
      );
      onCleanup(() => clearTimeout(timeoutId));
    });

    // Подписка и эффект заводятся здесь, а не в `ngOnInit`: хук сервиса из
    // `providers` зависит от того, успел ли компонент-владелец создать
    // экземпляр до своей гидратации, и при включении в рендере раскладки
    // может не вызваться вовсе. Конструктор выполняется гарантированно.
    this.startRouteWatch();
  }

  /**
   * Пункты меню «⚡ Действия» фичи текущей локации — рисуются в шапке экрана
   * внутри локации. Действия относятся к локации в целом, поэтому доступны
   * из любого её экрана, включая список комнат.
   */
  readonly featureMenuItems = computed<RoomMenuItem[]>(
    () => this.locationFeature()?.menuItems ?? [],
  );

  /**
   * Активна ли кнопка «Главная» в списке комнат — то же главное меню локации
   * (`location/:code/main`), когда не выбраны ни комната, ни раздел.
   */
  readonly activeHome = computed(
    () => this.panel() === 'location' && !this.selectedRoom() && !this.selectedFeatureId(),
  );

  /** id персонажа, для которого загружена текущая локация (чтобы не перезагружать без нужды). */
  private loadedCharacterId: number | null = null;
  private routeSub: Subscription | null = null;
  /** Последние параметры маршрута — чтобы переотработать их при смене персонажа. */
  private lastParams: Params = {};

  private startRouteWatch(): void {
    // Параметры маршрута — единственный источник переходов: подписка напрямую,
    // без toObservable/combineLatest. В zoneless-режиме toObservable ждёт
    // прохода change detection, из-за чего combineLatest не срабатывал и
    // applyRoute не выполнялся ни разу — переходы по маршрутам не меняли панель.
    this.routeSub = this.route.params.subscribe((params) => {
      this.lastParams = params;
      this.applyRoute(params, this.currentChatUserService.currentChatUser());
    });

    // Персонаж подтягивается позже роутера: переотрабатываем тот же маршрут,
    // когда он появится (deep-link открывается до загрузки профиля).
    effect(() => {
      const character = this.currentChatUserService.currentChatUser();
      // applyRoute пишет в сигналы состояния — читаем их вне отслеживания,
      // иначе эффект зациклился бы на сам себе.
      untracked(() => this.applyRoute(this.lastParams, character));
    });
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    // Фичу НЕ освобождаем: переходы между комнатами/разделами пересоздают
    // компонент, а состояние (например авторизация сотрудником мэрии) должно
    // пережить переход. Освобождает её `stopLocationFeature` — при уходе
    // из локации (смена локации, `/chat`, ошибка доступа).
  }

  // ─── навигация ───────────────────────────────────────────────────────────

  onLocationSelected(location: ILocation): void {
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onCreateLocation(): void {
    this.router.navigate(['/chat/location/create']);
  }

  onFindLocation(): void {
    this.router.navigate(['/chat/location/find']);
  }

  onLocationCreated(location: ILocation): void {
    // Навигация на новую локацию → шелл пересоздаётся, список локаций подгрузит её сам.
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onLocationJoined(location: ILocation): void {
    this.router.navigate(['/chat/location', location.code, 'main']);
  }

  onCancelled(): void {
    this.router.navigate(['/chat']);
  }

  onRoomSelected(room: IRoom): void {
    const locCode = this.selectedLocation()?.code;
    if (locCode != null) {
      this.router.navigate(['/chat/location', locCode, 'room', room.id]);
    }
  }

  /**
   * Кнопка «Главная» в списке комнат — переход в главное меню локации
   * (разделы фичи). На десктопе комнаты всегда в сайдбаре, поэтому пункт
   * там и нужен; на мобиле главное меню уже на том же экране.
   */
  onRoomListHome(): void {
    const locCode = this.selectedLocation()?.code;
    if (locCode != null) {
      this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  onWork(): void {
    this.router.navigate(['/chat/work']);
  }

  onWorkCancelled(): void {
    this.router.navigate(['/chat']);
  }

  /** Переключение вкладки мобильной навигации — тоже переход по маршруту. */
  onTabSelected(tab: MobileTab): void {
    if (this.panel() === 'location') {
      this.featureStore.rememberLocationRoute(this.router.url);
      if (tab === 'locations') return;
    }

    if (tab === 'locations') {
      this.router.navigateByUrl(this.featureStore.rememberedLocationRoute ?? '/chat');
      return;
    }

    const target: Record<MobileTab, string> = {
      locations: '/chat',
      district: '/chat/district',
      profile: '/chat/me',
    };
    this.router.navigate([target[tab]]);
  }

  /** Полноэкранный экран настроек (мобильный вариант окна NavRail). */
  onOpenSettings(): void {
    this.router.navigate(['/chat/settings']);
  }

  /**
   * Назад на уровень вкладки: с экрана локации/комнаты — к списку локаций,
   * с полноэкранного экрана — к его вкладке. Аппаратная кнопка «назад»
   * и свайп вызывают тот же сценарий, что и стрелка в шапке.
   */
  onBackToTab(): void {
    if (this.panel() === 'location') {
      this.featureStore.clearRememberedLocationRoute();
    }
    this.router.navigate([this.tab() === 'locations' ? '/chat' : `/chat/${this.tab()}`]);
  }

  // ─── URL → состояние ─────────────────────────────────────────────────────

  /** Перевод текущего URL в состояние панели (URL — источник истины). */
  private applyRoute(params: Params, character: IChatUser | null): void {
    const page = (this.route.snapshot.data?.['page'] as ChatPanel) ?? 'empty';
    this.tab.set((this.route.snapshot.data?.['tab'] as MobileTab) ?? 'locations');
    // Локация адресуется code, а не числовым id: code уникален в пределах района,
    // район резолвится на беке из персонажа.
    const locationCode = params['code'] != null ? String(params['code']) : null;
    const roomId = params['roomId'] != null ? Number(params['roomId']) : null;
    const featureId = params['featureId'] != null ? String(params['featureId']) : null;

    switch (page) {
      case 'create':
        this.panel.set('create');
        this.cancelLocationLoad();
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'find':
        this.panel.set('find');
        this.cancelLocationLoad();
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'work':
        this.panel.set('work');
        this.cancelLocationLoad();
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.stopLocationFeature();
        break;
      case 'location':
        this.openLocation(locationCode, roomId, featureId, character);
        break;
      // Экраны мобильных вкладок живут вне локации, поэтому состояние
      // выбранной локации не трогают.
      case 'district':
      case 'profile':
      case 'settings':
        this.cancelLocationLoad();
        this.panel.set(page);
        break;
      default: // 'empty'
        this.panel.set('empty');
        this.cancelLocationLoad();
        this.sidebarMode.set('locations');
        this.selectedLocation.set(null);
        this.selectedRoom.set(null);
        this.selectedFeatureId.set(null);
        this.rooms.set([]);
        this.loadedCharacterId = null;
        this.featureStore.clearRememberedLocationRoute();
        this.stopLocationFeature();
    }
  }

  /** Открытие локации по deep-link: проверка доступа + загрузка комнат. */
  private openLocation(
    locationCode: string | null,
    roomId: number | null,
    featureId: string | null,
    character: IChatUser | null,
  ): void {
    if (locationCode == null) {
      this.cancelLocationLoad();
      this.router.navigate(['/chat']);
      return;
    }
    if (!character) {
      // Персонаж ещё не подтянулся — subscribe сработает повторно, когда загрузится.
      this.locationLoadAttempt.update((attempt) => attempt + 1);
      this.panel.set('location');
      this.locationLoading.set(true);
      return;
    }

    const locationChanged =
      this.selectedLocation()?.code !== locationCode ||
      this.loadedCharacterId !== character.id ||
      this.locationLoading();

    if (locationChanged) {
      this.loadLocation(locationCode, roomId, featureId, character.id);
    } else {
      // Та же локация, сменилась только комната/раздел — комнаты уже загружены.
      this.applyRoom(roomId);
      this.applyFeature(featureId);
      this.locationLoading.set(false);
    }
  }

  private loadLocation(
    locationCode: string,
    roomId: number | null,
    featureId: string | null,
    characterId: number,
  ): void {
    this.panel.set('location');
    const requestId = this.locationLoadAttempt() + 1;
    this.locationLoadAttempt.set(requestId);
    this.locationLoading.set(true);
    this.sidebarMode.set('rooms');
    if (this.selectedLocation()?.code !== locationCode) {
      this.selectedLocation.set(null);
      this.selectedRoom.set(null);
    } else if (roomId == null) {
      this.selectedRoom.set(null);
    }
    this.selectedFeatureId.set(null);
    this.rooms.set([]);

    this.locationService.getLocationByCode(locationCode, characterId).subscribe({
      next: (location) => {
        if (requestId !== this.locationLoadAttempt()) return;

        this.selectedLocation.set(location);
        this.sidebarMode.set('rooms');
        this.loadedCharacterId = characterId;
        this.buildLocationFeature(location, characterId);
        // Комнаты берём по внутреннему id локации — URL адресует локацию code'ом,
        // но дальше вглубь (комнаты, участники) работаем по id.
        this.loadRooms(location.id, roomId, requestId);
        this.applyFeature(featureId);
      },
      error: (err: HttpErrorResponse) => {
        if (requestId !== this.locationLoadAttempt()) return;

        this.locationLoading.set(false);
        this.loadedCharacterId = null;
        this.stopLocationFeature();
        // Текст причины отдаёт бэкенд (`message` из тела 403/404) — продуктовую
        // формулировку («не участник») не хардкодим на фронте, а прокидываем в URL,
        // чтобы она пережила F5. Иконка/заголовок — оформление самой страницы.
        const message = err.error?.message ?? null;
        if (err.status === 404) {
          this.router.navigate(['/chat/error'], { queryParams: { reason: 'not-found', message } });
        } else if (err.status === 403) {
          this.router.navigate(['/chat/error'], { queryParams: { reason: 'forbidden', message } });
        } else {
          this.router.navigate(['/chat']);
        }
      }
    });
  }

  private loadRooms(
    locationId: number,
    targetRoomId: number | null,
    requestId: number,
  ): void {
    this.locationService.getRooms(locationId).subscribe({
      next: (rooms) => {
        if (requestId !== this.locationLoadAttempt()) return;

        this.rooms.set(rooms);
        this.applyRoom(targetRoomId);
        this.locationLoading.set(false);
      },
      error: () => {
        if (requestId !== this.locationLoadAttempt()) return;

        this.rooms.set([]);
        this.selectedRoom.set(null);
        const currentLocationId = this.selectedLocation()?.id;
        if (currentLocationId != null) {
          this.featureStore.setCurrentRoom(currentLocationId, null);
        }
        this.locationLoading.set(false);
      }
    });
  }

  private cancelLocationLoad(): void {
    this.locationLoadAttempt.update((attempt) => attempt + 1);
    this.locationLoading.set(false);
  }

  /** Выбрать комнату из уже загруженного списка (или сбросить). */
  private applyRoom(roomId: number | null): void {
    if (roomId == null) {
      this.selectedRoom.set(null);
      const locationId = this.selectedLocation()?.id;
      if (locationId != null) {
        this.featureStore.setCurrentRoom(locationId, null);
      }
      return;
    }
    const room = this.rooms().find((r) => r.id === roomId);
    if (room) {
      this.selectedRoom.set(room);
      const locationId = this.selectedLocation()?.id;
      if (locationId != null) {
        this.featureStore.setCurrentRoom(locationId, room);
      }
    } else {
      // Некорректный roomId в URL — возвращаемся в главное меню локации.
      this.selectedRoom.set(null);
      const locationId = this.selectedLocation()?.id;
      if (locationId != null) {
        this.featureStore.setCurrentRoom(locationId, null);
      }
      const locCode = this.selectedLocation()?.code;
      if (locCode != null) this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  /** Выбрать раздел фичи локации (или сбросить). */
  private applyFeature(featureId: string | null): void {
    if (featureId == null) {
      this.selectedFeatureId.set(null);
      return;
    }
    const exists = this.locationFeature()?.screens.some((s) => s.id === featureId) ?? false;
    if (exists) {
      this.selectedFeatureId.set(featureId);
    } else {
      // Некорректный featureId в URL — возвращаемся в главное меню локации.
      const locCode = this.selectedLocation()?.code;
      if (locCode != null) this.router.navigate(['/chat/location', locCode, 'main']);
    }
  }

  // ─── фича локации ────────────────────────────────────────────────────────

  /**
   * Фича локации — берётся из `LocationFeatureStore`, поэтому её состояние
   * (например `employeeAuthorized` в мэрии) переживает переходы между
   * комнатами: шелл пересоздаётся, а фича остаётся прежней.
   *
   * Важно: здесь НЕ вызываем `stopLocationFeature()` — этот метод вызывается
   * при каждом пересоздании шелла, и предварительный release освободил бы
   * кэш до `acquire()`. Смена локации обрабатывается самим `acquire()`:
   * при другом ключе он освобождает прежнюю фичу.
   */
  private buildLocationFeature(location: ILocation, characterId: number): void {
    this.locationFeature.set(this.featureStore.acquire(location, characterId, this.injector));
  }

  /** Отпустить фичу локации (уход из локации / смена локации). */
  private stopLocationFeature(): void {
    this.featureStore.release();
    this.locationFeature.set(null);
  }
}