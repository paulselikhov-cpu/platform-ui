import { Component, input, output, signal, HostListener, inject, ElementRef, effect, computed } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';
import { SidebarContextMenuService } from '../../../services/frontend-services/context-menu/sidebar-context-menu.service';
import { switchMap } from 'rxjs';
import { OnlineTrackingService } from '../../../services/frontend-services/online-tracking/online-tracking.service';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { OnlineTrackingSidebarService } from '../../../services/frontend-services/online-tracking/online-tracking-sidebar.service';
@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  readonly location = input.required<ILocation>();
  readonly isActive = input<boolean>(false);
  //Онлайн-трекер
  private readonly onlineTrackingSidebarService = inject(OnlineTrackingSidebarService);
  //
  private readonly elRef = inject(ElementRef);

  //Контекстное меню
  private readonly contextMenuService = inject(SidebarContextMenuService);
  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  readonly contextAction = output<{ action: 'leave' | 'delete', location: ILocation }>();
  readonly menuX = signal(0);
  readonly menuY = signal(0);
  //
  get menuVisible(): boolean {
    return this.contextMenuService.isOpen(this.location().id);
  }
  get isOwner(): boolean {
    return this.location().memberRole === 'OWNER';
  }

  readonly onlineCountTotal = computed(() =>
    this.onlineTrackingSidebarService.countFor(this.location().id)()
  );

  private showMenu(x: number, y: number) {
    const menuWidth = 180;
    const menuHeight = 60;
    this.menuX.set(x + menuWidth > window.innerWidth ? x - menuWidth : x);
    this.menuY.set(y + menuHeight > window.innerHeight ? y - menuHeight : y);
    // закрывает предыдущее и открывает текущее
    this.contextMenuService.open(this.location().id);
  }

  private closeMenu() {
    this.contextMenuService.close();
  }

  onTouchStart(event: TouchEvent) {
    this.pressTimer = setTimeout(() => {
      const touch = event.touches[0];
      this.showMenu(touch.clientX, touch.clientY);
    }, 600);
  }

  onTouchEnd() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  onTouchMove() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.showMenu(event.clientX, event.clientY);
  }

  onAction(action: 'leave' | 'delete') {
    this.closeMenu();
    this.contextAction.emit({ action, location: this.location() });
  }

  // клик в любом месте документа — закрываем
  @HostListener('document:click')
  onDocumentClick() {
    if (this.menuVisible) {
      this.contextMenuService.close();
    }
  }

  // правый клик в другом месте — тоже закрываем
  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent) {
    if (this.menuVisible && !this.elRef.nativeElement.contains(event.target)) {
      this.contextMenuService.close();
    }
  }
}