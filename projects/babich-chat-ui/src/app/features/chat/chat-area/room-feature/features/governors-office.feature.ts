import { computed, inject, runInInjectionContext, signal } from '@angular/core';
import { BaseRoomFeature, RoomFeatureContent, RoomFeatureContext } from '../room-feature.interface';
import { CurrentChatUserService } from '../../../../../services/current-chat-user.service';
import { LocationPostService } from '../../../../../services/backend-services/http/location-post.service';
import { LocationPostType } from '../../../../../models/location-post/location-post.interface';

/**
 * Фича комнаты «Кабинет губернатора»: админ-панель видна только
 * текущему губернатору этой локации.
 */
export class GovernorsOfficeFeature extends BaseRoomFeature {
  override readonly contentKey: RoomFeatureContent = 'governors-admin';

  private locationPostService!: LocationPostService;
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
      this.locationPostService = inject(LocationPostService);
      this.currentUserService = inject(CurrentChatUserService);
    });
  }

  override onRoomEnter(): void {
    const location = this.ctx.location;
    if (location?.id == null) return;
    this.locationPostService.getPostsByLocation(location.id).subscribe({
      next: (posts) => {
        const governor = posts.find((p) => p.post === LocationPostType.GOVERNOR);
        this.governorCharacterId.set(governor?.characterId ?? null);
      },
      error: () => this.governorCharacterId.set(null),
    });
  }
}
