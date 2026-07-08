import { Component, inject, input, output } from '@angular/core';
import { MessageContextMenuService } from '../../../../services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../../services/messages/message-selection.service';
import { IChatMessage } from '../../../../models/messages/message.interface';

export interface ContextMenuAction {
  type: 'reply' | 'select' | 'copy' | 'delete';
  messageId: number;
  content?: string;
}

@Component({
  selector: 'app-message-context-menu',
  templateUrl: './message-context-menu.html',
  styleUrl: './message-context-menu.scss'
})
export class MessageContextMenu {
  
  private menuService = inject(MessageContextMenuService);
  protected selectionService = inject(MessageSelectionService);

  action = output<ContextMenuAction>();
  get state() { 
    return this.menuService.state(); 
  }

  onReply() {
    this.action.emit({ type: 'reply', messageId: this.state.messageId });
    this.menuService.close();
  }

  onSelect() {
    this.selectionService.startSelection(this.state.messageId);
    this.menuService.close();
  }

  onCopy() {
    navigator.clipboard.writeText(this.state.content);
    this.action.emit({ type: 'copy', messageId: this.state.messageId });
    this.menuService.close();
  }

  onDelete() {
    this.action.emit({ type: 'delete', messageId: this.state.messageId });
    this.menuService.close();
  }
}