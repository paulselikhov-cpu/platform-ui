import { Component, computed, effect, inject, output, untracked, viewChild } from '@angular/core';
import { MessageContextMenuService } from '../../services/message-context-menu.service';
import { MessageSelectionService } from '../../services/message-selection.service';
import { ActionsMenu } from '../../../../../shared/components/actions-menu/actions-menu';
import { RoomMenuItem } from '../../../../../shared/components/actions-menu/room-menu-item.interface';

export interface ContextMenuAction {
  type: 'reply' | 'select' | 'copy' | 'delete';
  messageId: number;
  content?: string;
}

/** Контекстное меню сообщения: пункты + открытие в точке клика/касания. */
@Component({
  selector: 'app-message-context-menu',
  imports: [ActionsMenu],
  templateUrl: './message-context-menu.html',
})
export class MessageContextMenu {
  private readonly menuService = inject(MessageContextMenuService);
  private readonly selectionService = inject(MessageSelectionService);

  readonly action = output<ContextMenuAction>();

  private readonly menu = viewChild(ActionsMenu);

  /**
   * Пункты строятся из состояния сервиса. id и текст сообщения
   * запоминаются здесь, потому что к моменту нажатия сервис уже
   * сбросит состояние (меню закрывается раньше, чем выполняется пункт).
   */
  readonly items = computed<RoomMenuItem[]>(() => {
    const { messageId, content, isOwnMessage } = this.menuService.state();

    const items: RoomMenuItem[] = [
      {
        id: 'reply',
        icon: '↩️',
        label: 'Ответить',
        visible: () => this.selectionService.selectedCount() <= 1,
        run: () => this.action.emit({ type: 'reply', messageId }),
      },
      {
        id: 'select',
        icon: '☑️',
        label: 'Выделить',
        run: () => this.selectionService.startSelection(messageId),
      },
      {
        id: 'copy',
        icon: '📋',
        label: 'Копировать',
        run: () => {
          navigator.clipboard.writeText(content);
          this.action.emit({ type: 'copy', messageId });
        },
      },
    ];

    if (isOwnMessage) {
      items.push({
        id: 'delete',
        icon: '🗑',
        label: 'Удалить',
        danger: true,
        run: () => this.action.emit({ type: 'delete', messageId }),
      });
    }
    return items;
  });

  constructor() {
    // Открываем меню в точке из сервиса. Эффект сработает и когда вложенный
    // ActionsMenu появится в DOM, и когда пользователь вызовет меню на другом
    // сообщении, не закрыв предыдущее.
    effect(() => {
      const menu = this.menu();
      const state = this.menuService.state();
      if (!menu || !state.visible) return;
      untracked(() => menu.openAt(state.x, state.y));
    });
  }

  onClosed(): void {
    this.menuService.close();
  }
}