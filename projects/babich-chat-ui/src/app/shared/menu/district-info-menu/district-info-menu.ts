import { Component, computed, inject, signal } from '@angular/core';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { LocationUsersService } from '../../../services/backend-services/http/location-users.service';
import { ILocationSystemRole, SystemRoleType } from '../../../models/system-role/system-role.interface';
import { SystemLocationCode } from '../../../models/location/location-type.enum';

@Component({
  selector: 'app-district-info-menu',
  templateUrl: './district-info-menu.html',
  styleUrl: './district-info-menu.scss',
  standalone: true,
})
export class DistrictInfoMenu {
  readonly currentPage = signal<'menu' | 'rules' | 'police' | 'layer'>('menu');

  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly districtService = inject(DistrictService);
  private readonly locationUsersService = inject(LocationUsersService);

  /** Должности мэрии (по ним показываем губернатора/мэра/депутатов). */
  readonly cityHallPosts = signal<ILocationSystemRole[]>([]);

  constructor() {
    this.loadCityHallPosts();
  }

  private loadCityHallPosts(): void {
    const districtId = this.currentUserService.selectedDistrictId();
    if (districtId == null) return;

    this.districtService.getSystemLocations(districtId).subscribe({
      next: (locations) => {
        const cityHall = locations.find(
          (l) => l.code === SystemLocationCode.CITY_HALL,
        );
        if (!cityHall) return;
        this.locationUsersService.getSystemRolesByLocation(cityHall.id).subscribe({
          next: (posts) => this.cityHallPosts.set(posts),
        });
      },
    });
  }

  /** Персонаж на должности GOVERNOR мэрии. */
  readonly governorName = computed(() => {
    const post = this.cityHallPosts().find(
      (p) => p.systemRole === SystemRoleType.GOVERNOR,
    );
    return post?.characterName ?? '—';
  });

  /** Персонаж на должности MAYOR мэрии. */
  readonly mayorName = computed(() => {
    const post = this.cityHallPosts().find(
      (p) => p.systemRole === SystemRoleType.MAYOR,
    );
    return post?.characterName ?? '—';
  });

  /** Депутаты мэрии. */
  readonly deputies = computed(() =>
    this.cityHallPosts()
      .filter((p) => p.systemRole === SystemRoleType.DEPUTY)
      .map((p) => p.characterName),
  );

  goBack(): void {
    this.currentPage.set('menu');
  }
}