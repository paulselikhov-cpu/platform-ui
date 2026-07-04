import { Component, input, output, signal, HostListener, inject, ElementRef } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';

@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  private elRef = inject(ElementRef);

  location = input.required<ILocation>();
  isActive = input<boolean>(false);

  // события для родителя
  contextAction = output<{ action: 'leave' | 'delete', location: ILocation }>();

  // контекстное меню
  menuVisible = signal(false);
  menuX = signal(0);
  menuY = signal(0);

  // правая кнопка мыши — десктоп
  onContextMenu(event: MouseEvent) {
    event.preventDefault();
    this.showMenu(event.clientX, event.clientY);
  }

  // долгое нажатие — мобилка
  private pressTimer: ReturnType<typeof setTimeout> | null = null;

  onTouchStart(event: TouchEvent) {
    this.pressTimer = setTimeout(() => {
      const touch = event.touches[0];
      this.showMenu(touch.clientX, touch.clientY);
    }, 600); // 600мс = долгое нажатие
  }

  onTouchEnd() {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  onTouchMove() {
    // если палец двигается — отменяем долгое нажатие
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  private showMenu(x: number, y: number) {
    // корректируем позицию чтобы меню не вылезло за экран
    const menuWidth = 180;
    const menuHeight = 60;
    this.menuX.set(x + menuWidth > window.innerWidth ? x - menuWidth : x);
    this.menuY.set(y + menuHeight > window.innerHeight ? y - menuHeight : y);
    this.menuVisible.set(true);
  }

  closeMenu() {
    this.menuVisible.set(false);
  }

  onAction(action: 'leave' | 'delete') {
    this.closeMenu();
    this.contextAction.emit({ action, location: this.location() });
  }

  // клик вне меню — закрываем
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.closeMenu();
    }
  }

  get isOwner(): boolean {
    return this.location().memberRole === 'OWNER';
  }
}