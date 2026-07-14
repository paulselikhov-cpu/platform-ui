import { Component, input, output, signal, HostListener, inject, ElementRef, effect, computed } from '@angular/core';
import { ILocation } from '../../../models/location/location.interface';
import { SidebarContextMenuService } from '../../../services/frontend-services/context-menu/sidebar-context-menu.service';
import { LocationMembersService } from '../../../services/backend-services/chat/http/location-members.service';
import { switchMap } from 'rxjs';
import { ChatWebSocketService } from '../../../services/backend-services/chat/webSocket/chat-websocket.service';
import { IPresenceEvent } from '../../../models/presence/presence.interface';
@Component({
  selector: 'app-location-item',
  templateUrl: './location-item.html',
  styleUrl: './location-item.scss'
})
export class LocationItem {
  private elRef = inject(ElementRef);
  private contextMenuService = inject(SidebarContextMenuService);
  private readonly locationMembersService = inject(LocationMembersService);
  private readonly chatWebSocketService = inject(ChatWebSocketService);

  location = input.required<ILocation>();
  isActive = input<boolean>(false);

  contextAction = output<{ action: 'leave' | 'delete', location: ILocation }>();

  menuX = signal(0);
  menuY = signal(0);

  // читаем из глобального сервиса
  get menuVisible(): boolean {
    return this.contextMenuService.isOpen(this.location().id);
  }

  get isOwner(): boolean {
    return this.location().memberRole === 'OWNER';
  }

  private pressTimer: ReturnType<typeof setTimeout> | null = null;

  // Счётчик онлайн пользователей
  private readonly trackedOnlineIds = signal<Set<number>>(new Set());
  readonly onlineCountTotal = computed(() => this.trackedOnlineIds().size);

  constructor() {
    effect((onCleanup) => {
      const locationId = this.location().id;
      const onlineCharactersSub = this.locationMembersService.getOnlineCharacterIds(locationId).pipe( switchMap( onlineCharacterIds => {
        const idsSet = new Set(onlineCharacterIds);
        this.trackedOnlineIds.set(idsSet);
        return this.chatWebSocketService.topic<IPresenceEvent>(`/topic/location.${locationId}.presence`)
      })).subscribe( event => {
        this.trackedOnlineIds.update(ids => {
          const next = new Set(ids);
          event.online ? next.add(event.characterId) : next.delete(event.characterId);
          return next;
        });
      })

      onCleanup(() => {
        onlineCharactersSub.unsubscribe();
      });
    })
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