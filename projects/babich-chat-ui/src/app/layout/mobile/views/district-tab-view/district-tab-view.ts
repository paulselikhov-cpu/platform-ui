import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DistrictNewsFeed } from '../../../../shared/components/district-news-feed/district-news-feed';
import { NotificationSettingsMenu } from '../../../../shared/menu/my-notifications-menu/my-notifications-menu';
import { DistrictInfoMenu } from '../../../../shared/menu/district-info-menu/district-info-menu';
import { DefaultTabsSet, DefaultTabOption } from '../../../../shared/components/default-tabs-set/default-tabs-set';

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
  imports: [DistrictNewsFeed, NotificationSettingsMenu, DistrictInfoMenu, DefaultTabsSet],
  templateUrl: './district-tab-view.html',
  styleUrl: './district-tab-view.scss',
})
export class DistrictTabView {
  readonly tabs: DefaultTabOption[] = [
    { id: 'news', label: 'Новости' },
    { id: 'notifications', label: 'Уведомления' },
    { id: 'info', label: 'О районе' },
  ];

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

  onSegmentChange(segment: string): void {
    switch (segment) {
      case 'news':
        void this.router.navigate(['/chat/district'], { queryParams: this.infoRouteQueryParams() });
        break;
      case 'notifications':
        void this.router.navigate(['/chat/district/notifications'], { queryParams: this.infoRouteQueryParams() });
        break;
      case 'info':
        void this.router.navigate([this.infoRoute()]);
        break;
    }
  }
}