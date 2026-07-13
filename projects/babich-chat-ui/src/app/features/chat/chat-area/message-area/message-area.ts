import { Component, computed, ElementRef, HostListener, inject, input } from '@angular/core';
import { EmojiParsePipe } from '../../../../pipes/emoji-pars.pipe';
import { AuthService } from '../../../../services/backend-services/auth/auth.service';
import { DatePipe } from '@angular/common';
import { MessageContextMenuService } from '../../../../services/frontend-services/context-menu/message-context-menu.service';
import { MessageSelectionService } from '../../../../services/frontend-services/messages/message-selection.service';

interface IMessageArea {
  id: number;
  avatarName: string;
  sender: string;
  timestamp: string;
  content: string;
  isDeleted: boolean;
  userId: number;
}
@Component({
  selector: 'app-message-area',
  imports: [EmojiParsePipe, DatePipe],
  templateUrl: './message-area.html',
  styleUrl: './message-area.scss',
})
export class MessageArea {
   msg = input.required<IMessageArea>();

   private authService = inject(AuthService);
   private messageContextMenuService = inject(MessageContextMenuService);
   private elRef = inject(ElementRef);
   readonly selectionService = inject(MessageSelectionService);

  // ─── контекстное меню ────────────────────────────────────────────────────
  onMessageContextMenu(
    event: MouseEvent | Touch,
    msgId: number,
    content: string,
    senderId: number | undefined
  ) {
    if (event instanceof MouseEvent) event.preventDefault();

    const currentUser = this.authService.currentUser();
    const isOwn = senderId !== undefined && currentUser?.userId === senderId;

    const x = event instanceof MouseEvent ? event.clientX : event.clientX;
    const y = event instanceof MouseEvent ? event.clientY : event.clientY;

    this.messageContextMenuService.open(x, y, msgId, isOwn, content);

  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent) {
    // if (this.messageContextMenuService.state().visible && !this.elRef.nativeElement.contains(event.target)) {
    //   debugger
    //   this.messageContextMenuService.close();
    // }
  }

  @HostListener('document:click')
  onOutsideClick() {
    if (this.messageContextMenuService.state().visible) this.messageContextMenuService.close();
  }
}
