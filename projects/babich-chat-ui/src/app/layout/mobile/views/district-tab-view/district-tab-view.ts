import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DistrictNewsFeed } from '../../../../shared/components/district-news-feed/district-news-feed';
import { NotificationSettingsMenu } from '../../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictInfoMenu } from '../../../../shared/menu/district-info-menu/district-info-menu';
import { DefaultButtonComponent } from '../../../../shared/components/buttons/default-button/default-button';

const DISTRICT_INFO_ROUTES = new Set([
  '/chat/district/info',
  '/chat/district/info/rules',
  '/chat/district/info/city-hall',
  '/chat/district/info/police',
  '/chat/district/info/settings',
  '/chat/district/info/settings/election',
  '/chat/district/info/settings/recall',
  '/chat/district/info/settings/roles',
]);

/**
 * Экран вкладки «Район»: новости, уведомления и сведения о районе.
 *
 */
@Component({
  selector: 'app-district-tab-view',
  imports: [DistrictNewsFeed, NotificationSettingsMenu, DistrictInfoMenu, DefaultButtonComponent, RouterLink],
  templateUrl: './district-tab-view.html',
  styleUrl: './district-tab-view.scss',
})
export class DistrictTabView {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);

  /** Активная вкладка района берётся из URL, чтобы deep-link открывал нужный раздел. */
  readonly segment = signal<'news' | 'notifications' | 'info'>(
    this.route.snapshot.data['districtSegment'] ?? 'news',
  );
  readonly infoRoute = signal(this.initialInfoRoute());
  readonly infoRouteQueryParams = computed(() => ({
    districtInfoRoute: this.infoRoute(),
  }));

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      this.segment.set(data['districtSegment'] ?? 'news');
    });
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        const infoRoute = params.get('districtInfoRoute');
        if (infoRoute && DISTRICT_INFO_ROUTES.has(infoRoute)) {
          this.infoRoute.set(infoRoute);
        }
      });
  }

  private initialInfoRoute(): string {
    const currentPath = this.router.url.split(/[?#]/, 1)[0];
    if (DISTRICT_INFO_ROUTES.has(currentPath)) {
      return currentPath;
    }

    const savedRoute = this.route.snapshot.queryParamMap.get('districtInfoRoute');
    return savedRoute && DISTRICT_INFO_ROUTES.has(savedRoute)
      ? savedRoute
      : '/chat/district/info';
  }
}