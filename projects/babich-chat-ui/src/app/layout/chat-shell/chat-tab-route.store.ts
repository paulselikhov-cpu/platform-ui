import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChatTabRouteStore {
  private districtRoute: string | null = null;
  private profileRoute: string | null = null;

  rememberDistrictRoute(route: string): void {
    this.districtRoute = route;
  }

  get rememberedDistrictRoute(): string | null {
    return this.districtRoute;
  }

  rememberProfileRoute(route: string): void {
    this.profileRoute = route;
  }

  get rememberedProfileRoute(): string | null {
    return this.profileRoute;
  }
}
