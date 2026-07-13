import { Injectable, signal, computed, input } from '@angular/core';

/**
 * Сервис управления режимом выделения сообщений.
 * Глобальный — чтобы контекстное меню и панель действий
 * могли общаться через один источник правды.
 */
@Injectable({ providedIn: 'root' })
export class MessageSelectionService {
  // режим выделения включён/выключен
  selectionMode = signal(false);

  // Set выделенных id сообщений
  private selectedIds = signal<Set<number>>(new Set());

  // количество выделенных
  selectedCount = computed(() => this.selectedIds().size);

  // массив выделенных id для отправки на бэк
  selectedIdsList = computed(() => Array.from(this.selectedIds()));

  isSelected(id: number): boolean {
    return this.selectedIds().has(id);
  }

  // включить режим выделения и сразу выделить первое сообщение
  startSelection(messageId: number) {
    this.selectionMode.set(true);
    this.selectedIds.set(new Set([messageId]));
  }

  toggleSelection(id: number) {
    this.selectedIds.update(set => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  selectAll(ids: number[]) {
    this.selectedIds.set(new Set(ids));
  }

  clearSelection() {
    this.selectedIds.set(new Set());
    this.selectionMode.set(false);
  }
}