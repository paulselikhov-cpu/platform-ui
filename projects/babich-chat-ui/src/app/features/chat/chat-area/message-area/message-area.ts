import { Component, computed, ElementRef, HostListener, inject, input } from '@angular/core';
import { EmojiParsePipe } from '../../../../pipes/emoji-pars.pipe';
import { AuthService } from '../../../../core/services/auth.service';
import { MessageContextMenuService } from '../../../../services/context-menu/message-context-menu.service';
import { DatePipe } from '@angular/common';
import { MessageSelectionService } from '../../../../services/message-selection.service';

interface IMessageArea {
  id: number;
  avatarName: string;
  sender: string;
  timestamp: string;
  content: string;
  isDeleted?: boolean;
  userId?: number;
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
   private ctxMenuService = inject(MessageContextMenuService);
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

    this.ctxMenuService.open(x, y, msgId, isOwn, content);

  }

  @HostListener('document:contextmenu', ['$event'])
  onDocumentContextMenu(event: MouseEvent) {
    // if (this.ctxMenuService.state().visible && !this.elRef.nativeElement.contains(event.target)) {
    //   debugger
    //   this.ctxMenuService.close();
    // }
  }

  @HostListener('document:click')
  onOutsideClick() {
    if (this.ctxMenuService.state().visible) this.ctxMenuService.close();
  }
}
