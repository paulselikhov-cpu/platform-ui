import { Component, inject, output } from '@angular/core';
import { MessageSelectionService } from '../../../../services/message-selection.service';

@Component({
  selector: 'app-selection-toolbar',
  templateUrl: './selection-toolbar.html',
  styleUrl: './selection-toolbar.scss'
})
export class SelectionToolbar {
  selectionService = inject(MessageSelectionService);

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
}