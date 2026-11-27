import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentChatUserService } from '../../../services/current-chat-user.service';
import { DistrictService } from '../../../services/backend-services/http/district.service';
import { LocationUsersService } from '../../../services/backend-services/http/location-users.service';
import { ILocationSystemRole, SystemRoleType } from '../../../models/system-role/system-role.interface';
import { SystemLocationCode } from '../../../models/location/location-type.enum';
import { ChatRole } from '../../../models/chatUser/chatUser.interface';
import { DistrictSettingsMenu } from '../district-settings-menu/district-settings-menu';
import { DefaultButtonComponent } from '../../components/buttons/default-button/default-button';
import { BackButton } from '../../components/buttons/back-button/back-button';

@Component({
  selector: 'app-district-info-menu',
  templateUrl: './district-info-menu.html',
  styleUrl: './district-info-menu.scss',
  standalone: true,
  imports: [DistrictSettingsMenu, DefaultButtonComponent, BackButton, RouterLink],
})
export class DistrictInfoMenu {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly currentUserService = inject(CurrentChatUserService);
  private readonly districtService = inject(DistrictService);
  private readonly locationUsersService = inject(LocationUsersService);

  readonly currentPage = signal<'menu' | 'rules' | 'police' | 'city-hall' | 'settings'>(
    this.routePage(),
  );

  /** Должности мэрии (по ним показываем губернатора/мэра/депутатов). */
  readonly cityHallPosts = signal<ILocationSystemRole[]>([]);

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.currentPage.set(data['districtInfoPage'] ?? 'menu');
    });
    this.loadCityHallPosts();
  }

  private routePage(): 'menu' | 'rules' | 'police' | 'city-hall' | 'settings' {
    return this.route.snapshot.data['districtInfoPage'] ?? 'menu';
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

  readonly isStaff = computed(() => {
    const role = this.currentUserService.currentChatUser()?.role;
    return role === ChatRole.ADMIN || role === ChatRole.MODERATOR;
  });

  goBack(): void {
    this.router.navigateByUrl('/chat/district/info');
  }
}