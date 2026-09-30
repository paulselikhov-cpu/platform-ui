import { computed, inject, runInInjectionContext, signal } from '@angular/core';
import { EMPTY, Observable, tap } from 'rxjs';
import { BaseRoomFeature, RoomFeatureContext, RoomFeatureView } from '../room-feature.interface';
import { RoomMenuItem } from '../../../shared/components/actions-menu/room-menu-item.interface';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { LocationUsersService } from '../../../services/backend-services/http/location-users.service';
import { MessageService } from '../../../services/message.service';
import { SystemRoleType } from '../../../models/system-role/system-role.interface';
import { EmployeeOfficeView } from './views/employee-office-view/employee-office.view';
import { CityServicesView } from './views/city-services-view/city-services.view';

/** Должности мэрии, дающие статус сотрудника. */
const CITY_HALL_POSTS: readonly string[] = [
  SystemRoleType.GOVERNOR,
  SystemRoleType.MAYOR,
  SystemRoleType.DEPUTY,
];

/** Должность мэра (DB: на (location_id, system_role) — один человек). */
const MAYOR_POST = SystemRoleType.MAYOR;

/**
 * Фича комнаты «Приёмная»: действие «Авторизоваться как сотрудник мэрии»
 * (проверка по должностям GOVERNOR/MAYOR/DEPUTY на бэке) и админ-действие
 * «Назначить себя мэром» (POST /api/location-posts/appoint, проверка роли).
 */
export class ReceptionFeature extends BaseRoomFeature {
  /** Режимы отображения приёмной (кнопки внизу room-view). */
  override readonly views: RoomFeatureView[] = [
    {
      id: 'employee-office',
      label: 'Личный кабинет сотрудника',
      icon: '🪪',
      component: EmployeeOfficeView,
      visible: () => this.employeeAuthorized(),
    },
    {
      id: 'city-services',
      label: 'Услуги мэрии',
      icon: '🏛️',
      component: CityServicesView,
      visible: () => !this.employeeAuthorized(),
    },
  ];

  private currentUserService!: CurrentChatUserService;
  private locationUsersService!: LocationUsersService;
  private toast!: MessageService;

  /** Текущие должности в локации мэрии (свежие — перезагружаются после назначения). */
  readonly cityHallPosts = signal<readonly { systemRole: string; characterId: number | null }[]>([]);

  /** Сессия «режим сотрудника мэрии» (вход/выход — отдельно от факта должности). */
  readonly employeeAuthorized = signal(false);

  /** Текущий персонаж — мэр этой мэрии. */
  readonly isMayor = computed(() => {
    const myId = this.currentUserService.currentChatUser()?.id ?? null;
    return (
      myId != null &&
      this.cityHallPosts().some(
        (p) => p.systemRole === MAYOR_POST && p.characterId === myId,
      )
    );
  });

  /** Текущий персонаж — админ платформы. */
  readonly isAdmin = computed(
    () => this.currentUserService.currentChatUser()?.role === 'ADMIN',
  );

  override readonly menuItems: RoomMenuItem[] = [
    {
      id: 'employee-login',
      icon: '🪪',
      label: 'Авторизоваться как сотрудник мэрии',
      confirm: {
        icon: '🪪',
        title: 'Авторизоваться как сотрудник мэрии?',
        message:
          'Доступ подтверждается по вашей должности в мэрии.<br/>Если вы не занимаете должность — авторизация не пройдёт.',
        confirmText: 'Да!',
        cancelText: 'Нет!',
        confirmDanger: false,
      },
      visible: () => !this.employeeAuthorized(),
      run: () => this.loginAsEmployee(),
    },
    {
      id: 'employee-logout',
      icon: '🚪',
      label: 'Выйти из профиля сотрудника',
      visible: () => this.employeeAuthorized(),
      run: () => this.logoutEmployee(),
    },
    {
      id: 'admin-appoint-mayor',
      icon: '👑',
      label: 'Админ: назначить меня на должность мэра',
      danger: true,
      confirm: {
        icon: '👑',
        title: 'Назначить себя мэром?',
        message:
          'Вы будете назначены на должность MAYOR в этой локации.<br/>Действие доступно только админам платформы.',
        confirmText: 'Да!',
        cancelText: 'Нет!',
        confirmDanger: true,
      },
      visible: () => this.isAdmin() && !this.isMayor(),
      run: () => this.appointSelfAsMayor(),
    },
  ];

  constructor(ctx: RoomFeatureContext) {
    super();
    this.init(ctx);
    runInInjectionContext(ctx.injector, () => {
      this.currentUserService = inject(CurrentChatUserService);
      this.locationUsersService = inject(LocationUsersService);
      this.toast = inject(MessageService);
    });
  }

  override onRoomEnter(): void {
    const location = this.ctx.location;
    if (location?.id == null) return;
    this.locationUsersService.getSystemRolesByLocation(location.id).subscribe({
      next: (posts) => this.cityHallPosts.set(posts),
      error: () => this.cityHallPosts.set([]),
    });
  }

  /**
   * Проверить должность текущего персонажа на бэке (свежие данные) и
   * открыть «режим сотрудника мэрии». Возвращает Observable — ActionsMenu
   * держит загрузку в ConfirmModal до завершения.
   */
  loginAsEmployee(): Observable<unknown> {
    const characterId = this.currentUserService.currentChatUser()?.id;
    if (characterId == null) {
      this.toast.error('Персонаж не найден — авторизация невозможна');
      return EMPTY;
    }
    return this.locationUsersService.getSystemRolesByLocation(this.ctx.location.id).pipe( // TODO(application): Перенести проверку авторизации на бэкенд?
      tap({
        next: (posts) => {
          const isEmployee = posts.some(
            (p) => CITY_HALL_POSTS.includes(p.systemRole) && p.characterId === characterId,
          );
          if (isEmployee) {
            this.cityHallPosts.set(posts);
            this.employeeAuthorized.set(true);
            this.toast.success('Вы авторизованы как сотрудник мэрии');
          } else {
            this.toast.error('Вы не занимаете должность в мэрии — доступ запрещён');
          }
        },
        error: () => {
          this.toast.error('Не удалось проверить должности мэрии');
        },
      }),
    );
  }

  /** Завершить сессию сотрудника (оставаться на должности — должность не снимается). */
  logoutEmployee(): void {
    this.employeeAuthorized.set(false);
    this.toast.success('Вы вышли из профиля сотрудника мэрии');
  }

  /**
   * Назначить текущего персонажа на должность MAYOR (админ-действие).
   * Сначала свежий GET: если персонаж уже мэр — оранжевый warning, POST нет.
   * Если должность занята другим — error. Иначе POST /appoint и перезагрузка.
   */
  appointSelfAsMayor(): Observable<unknown> {
    const characterId = this.currentUserService.currentChatUser()?.id;
    const locationId = this.ctx.location.id;
    if (characterId == null || locationId == null) {
      this.toast.error('Персонаж или локация не найдены');
      return EMPTY;
    }
    return this.locationUsersService.getSystemRolesByLocation(locationId).pipe(
      tap((posts) => this.cityHallPosts.set(posts)),
      tap((posts) => {
        const alreadyMine = posts.some(
          (p) => p.systemRole === MAYOR_POST && p.characterId === characterId,
        );
        if (alreadyMine) {
          this.toast.warning('Вы уже авторизованы как мэр');
          return;
        }
        const takenByOther = posts.some(
          (p) => p.systemRole === MAYOR_POST && p.characterId !== characterId,
        );
        if (takenByOther) {
          this.toast.error('Должность мэра уже занята');
          return;
        }
        this.locationUsersService.appointSystemRole(locationId, characterId, MAYOR_POST).subscribe({
          next: () => {
            this.toast.success('Вы назначены на должность мэра');
            this.refreshCityHallPosts();
          },
          error: (err) => {
            this.toast.error(err?.error?.message ?? 'Не удалось назначить на должность мэра');
          },
        });
      }),
    );
  }

  /** Перезагрузить должности мэрии (после назначения). */
  private refreshCityHallPosts(): void {
    const locationId = this.ctx.location.id;
    if (locationId == null) return;
    this.locationUsersService.getSystemRolesByLocation(locationId).subscribe({
      next: (posts) => this.cityHallPosts.set(posts),
      error: () => this.cityHallPosts.set([]),
    });
  }
}

