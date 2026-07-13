import { Component, inject, input, output } from '@angular/core';
import { IChatMessage } from '../../../../models/messages/message.interface';
import { AuthService } from '../../../../services/backend-services/auth/auth.service';
import { ILocation } from '../../../../models/location/location.interface';
import { MessageSelectionService } from '../../../../services/frontend-services/messages/message-selection.service';

@Component({
  selector: 'app-selection-toolbar',
  templateUrl: './selection-toolbar.html',
  styleUrl: './selection-toolbar.scss'
})
export class SelectionToolbar {
  private authService = inject(AuthService);
  protected selectionService = inject(MessageSelectionService);

  allMessages = input.required<IChatMessage[]>();
  location = input.required<ILocation>();

  copySelected = output<number[]>();
  deleteSelected = output<number[]>();

  onCopy() {
    this.copySelected.emit(this.selectionService.selectedIdsList());
  }

  onDelete() {
    this.deleteSelected.emit(this.selectionService.selectedIdsList());
  }

  onCancel() {
    this.selectionService.clearSelection();
  }

  isEveryCurrentUserMessages(): boolean {
    const currentUser = this.authService.currentUser();
    const ids = this.selectionService.selectedIdsList();
    const allMessagesIds = this.allMessages();
    const findedIds = allMessagesIds.filter(item => ids.includes(item.id));
    return findedIds.every( item => item.character.userId === currentUser?.userId);
  }
}