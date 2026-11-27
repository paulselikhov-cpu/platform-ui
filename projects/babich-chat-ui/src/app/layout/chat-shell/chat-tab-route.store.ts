import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatTabRouteStore {
  private locationRoute: string | null = null;
  private districtRoute: string | null = null;
  private profileRoute: string | null = null;
  private settingsReturnRoute: string | null = null;

  rememberLocationRoute(route: string): void {
    this.locationRoute = route;
  }

  get rememberedLocationRoute(): string | null {
    return this.locationRoute;
  }

  clearLocationRoute(): void {
    this.locationRoute = null;
  }

  rememberDistrictRoute(route: string): void {
    this.districtRoute = route;
  }

  get rememberedDistrictRoute(): string | null {
    return this.districtRoute;
  }

  rememberProfileRoute(route: string): void {
    this.profileRoute = route;
  }

  rememberSettingsReturnRoute(route: string): void {
    this.settingsReturnRoute = route;
  }

  get rememberedSettingsReturnRoute(): string | null {
    return this.settingsReturnRoute;
  }

  clearSettingsReturnRoute(): void {
    this.settingsReturnRoute = null;
  }

  get rememberedProfileRoute(): string | null {
    return this.profileRoute;
  }
}
