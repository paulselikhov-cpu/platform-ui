import { Component, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { DefaultInput } from '../default-input/default-input.component';

export type DTMode = 'vertical' | 'horizontal';

export interface DTItemOption {
  value: string | number;
  label: string;
}

export interface DTColumn {
  key: string;
  label: string;
  /** text — просто значение, input — поле ввода, select — список. По умолчанию text. */
  type?: 'text' | 'input' | 'select';
  inputType?: 'text' | 'number';
  min?: number;
  max?: number;
  /** Ширина контрола: '96px', '100%'. */
  width?: string;
  /** select: готовый список вариантов. */
  options?: DTItemOption[];
  /** select: запрос справочника (вызывается один раз). */
  optionsLoader?: () => Observable<DTItemOption[]>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DTItem = Record<string, any>;

export interface DTCellChange {
  item: DTItem;
  key: string;
  value: string | number;
}

/**
 * Универсальная таблица.
 *  - horizontal: колонки × строки (таблица записей);
 *  - vertical:   каждая запись — список «название → поле».
 */
@Component({
selector: 'app-default-table',
  standalone: true,
  templateUrl: './default-table.component.html',
  styleUrl: './default-table.component.scss',
  imports: [DefaultInput, NgTemplateOutlet],
})
export class  DefaultTable {
  readonly heading = input('');
  readonly mode = input<DTMode>('horizontal');
  readonly columns = input<DTColumn[]>([]);
  readonly items = input<DTItem[]>([]);
  readonly disabled = input(false);
  readonly emptyText = input('Нет данных');
  readonly loading = input(false);

  /** Поиск: показывается, если задан searchLabel. */
  readonly searchLabel = input('');
  readonly searchValue = input('');

  readonly cellChange = output<DTCellChange>();
  readonly searchChange = output<string>();

  private readonly destroyRef = inject(DestroyRef);
  private readonly requested = new Set<string>();
private readonly loaded = signal<Record<string, DTItemOption[]>>({});

  constructor() {
    effect(() => {
      const cols = this.columns();
      untracked(() => cols.forEach((c) => this.loadOptions(c)));
    });
  }

private loadOptions(col: DTColumn): void {
    if (col.type !== 'select' || !col.optionsLoader || this.requested.has(col.key)) return;
    this.requested.add(col.key);
    col.optionsLoader()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (opts) => this.loaded.update((m) => ({ ...m, [col.key]: opts })),
        error: () => this.requested.delete(col.key), // можно повторить при следующем изменении columns
      });
  }

  optionsOf(col: DTColumn): DTItemOption[] {
    return col.options ?? this.loaded()[col.key] ?? [];
  }

  widthOf(col: DTColumn): string {
    return col.width ?? (this.mode() === 'vertical' ? '140px' : '100%');
  }

  onSelect(item: DTItem, col: DTColumn, raw: string): void {
    const option = this.optionsOf(col).find((o) => String(o.value) === raw);
    if (option) this.cellChange.emit({ item, key: col.key, value: option.value });
  }

  onInput(item: DTItem, col: DTColumn, value: string | number): void {
    this.cellChange.emit({ item, key: col.key, value });
  }
}