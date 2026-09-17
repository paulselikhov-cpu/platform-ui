import { computed, inject, runInInjectionContext, signal } from '@angular/core';
import { BaseRoomFeature, RoomFeatureContext, RoomFeatureView } from '../room-feature.interface';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { LocationUsersService } from '../../../services/backend-services/http/location-users.service';
import { SystemRoleType } from '../../../models/system-role/system-role.interface';
import { GovernorsOfficeView } from './governors-office.view';

/**
 * Фича комнаты «Кабинет губернатора»: админ-панель видна только
 * текущему губернатору этой локации.
 */
export class GovernorsOfficeFeature extends BaseRoomFeature {
  override readonly views: RoomFeatureView[] = [
    {
      id: 'district-admin',
      label: 'Панель управления районом',
      icon: '🏛️',
      component: GovernorsOfficeView,
      // режим доступен только текущему губернатору этого района; остальным
      // комната остаётся обычным чатом (кнопок режимов не появляется)
      visible: () => this.isCurrentUserGovernor(),
    },
  ];

  private locationUsersService!: LocationUsersService;
  private currentUserService!: CurrentChatUserService;

  /** characterId персонажа на должности GOVERNOR (null — вакансия/не загружено). */
  readonly governorCharacterId = signal<number | null>(null);

  /** Текущий персонаж занимает должность губернатора в этой локации. */
  readonly isCurrentUserGovernor = computed(() => {
    const myCharacterId = this.currentUserService.currentChatUser()?.id ?? null;
    return myCharacterId != null && this.governorCharacterId() === myCharacterId;
  });

  constructor(ctx: RoomFeatureContext) {
    super();
    this.init(ctx);
    runInInjectionContext(ctx.injector, () => {
      this.locationUsersService = inject(LocationUsersService);
      this.currentUserService = inject(CurrentChatUserService);
    });
  }

  override onRoomEnter(): void {
    const location = this.ctx.location;
    if (location?.id == null) return;
    this.locationUsersService.getSystemRolesByLocation(location.id).subscribe({
      next: (posts) => {
        const governor = posts.find((p) => p.systemRole === SystemRoleType.GOVERNOR);
        this.governorCharacterId.set(governor?.characterId ?? null);
      },
      error: () => this.governorCharacterId.set(null),
    });
  }
}
