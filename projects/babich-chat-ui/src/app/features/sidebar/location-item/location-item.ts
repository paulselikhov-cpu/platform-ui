import { Component, input, output, signal, HostListener, inject, ElementRef } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';
import { ContextMenuService } from '../../../services/context-menu.service';

@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  private elRef = inject(ElementRef);
  private contextMenuService = inject(ContextMenuService);

  location = input.required<ILocation>();
  isActive = input<boolean>(false);
  contextAction = output<{ action: 'leave' | 'delete', location: ILocation }>();

  menuX = signal(0);
  menuY = signal(0);

  // читаем из глобального сервиса
  get menuVisible(): boolean {
    return this.contextMenuService.isOpen(this.location().id);
  }

  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.showMenu(event.clientX, event.clientY);
  }

  private pressTimer: ReturnType<typeof setTimeout> | null = null;

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

  private showMenu(x: number, y: number) {
    const menuWidth = 180;
    const menuHeight = 60;
    this.menuX.set(x + menuWidth > window.innerWidth ? x - menuWidth : x);
    this.menuY.set(y + menuHeight > window.innerHeight ? y - menuHeight : y);
    // закрывает предыдущее и открывает текущее
    this.contextMenuService.open(this.location().id);
  }

  closeMenu() {
    this.contextMenuService.close();
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
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.contextMenuService.close();
    }
  }

  get isOwner(): boolean {
    return this.location().memberRole === 'OWNER';
  }
}