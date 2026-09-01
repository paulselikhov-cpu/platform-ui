import { Component, output } from '@angular/core';

export type NavRailTab = 'home' | 'settings' | 'info' | 'notification';
export type NavRailAction = 'create' | 'find' | 'work';

@Component({
  selector: 'app-nav-rail',
  templateUrl: './nav-rail.html',
  styleUrl: './nav-rail.scss',
  standalone: true,
})
export class NavRail {
  readonly tabSelected = output<NavRailTab>();
  readonly actionSelected = output<NavRailAction>();

  onTabClick(tab: NavRailTab) {
    this.tabSelected.emit(tab);
  }

  onActionClick(action: NavRailAction) {
    this.actionSelected.emit(action);
  }
}