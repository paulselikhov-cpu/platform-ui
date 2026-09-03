import { Component, computed, inject, output, signal } from '@angular/core';
import { WindowModal } from '../window-modal/window-modal';
import { CurrentChatUserService } from '../../../../services/current-chat-user.service';
import { DistrictService } from '../../../../services/backend-services/http/district.service';
import { LocationPostService } from '../../../../services/backend-services/http/location-post.service';
import { ILocationPost, LocationPostType } from '../../../../models/location-post/location-post.interface';
import { PublicLocationType } from '../../../../models/district/public-location-type.enum';

@Component({
  selector: 'app-district-info-modal',
  templateUrl: './district-info-modal.html',
  styleUrl: './district-info-modal.scss',
  standalone: true,
  imports: [WindowModal],
})
export class DistrictInfoModal {
  readonly closeModal = output<void>();
  readonly currentPage = signal<'menu' | 'rules' | 'police' | 'layer'>('menu');

  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly districtService = inject(DistrictService);
  private readonly locationPostService = inject(LocationPostService);

  /** Должности мэрии (по ним показываем губернатора/мэра/депутатов). */
  readonly cityHallPosts = signal<ILocationPost[]>([]);

  constructor() {
    this.loadCityHallPosts();
  }

  private loadCityHallPosts(): void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) return;

    this.districtService.getSystemLocations(districtId).subscribe({
      next: (locations) => {
        const cityHall = locations.find(
          (l) => l.type === PublicLocationType.CITY_HALL,
        );
        if (!cityHall) return;
        this.locationPostService.getPostsByLocation(cityHall.id).subscribe({
          next: (posts) => this.cityHallPosts.set(posts),
        });
      },
    });
  }

  /** Персонаж на должности GOVERNOR мэрии. */
  readonly governorName = computed(() => {
    const post = this.cityHallPosts().find(
      (p) => p.post === LocationPostType.GOVERNOR,
    );
    return post?.characterName ?? '—';
  });

  /** Персонаж на должности MAYOR мэрии. */
  readonly mayorName = computed(() => {
    const post = this.cityHallPosts().find(
      (p) => p.post === LocationPostType.MAYOR,
    );
    return post?.characterName ?? '—';
  });

  /** Депутаты мэрии. */
  readonly deputies = computed(() =>
    this.cityHallPosts()
      .filter((p) => p.post === LocationPostType.DEPUTY)
      .map((p) => p.characterName),
  );

  goBack(): void {
    this.currentPage.set('menu');
  }
}
