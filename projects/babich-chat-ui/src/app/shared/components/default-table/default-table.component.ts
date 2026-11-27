import { booleanAttribute, Component, computed, DestroyRef, effect, inject, input, output, signal, untracked } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { map, Observable } from 'rxjs';
import { DefaultInput } from '../default-input/default-input.component';
import { DefaultSelect } from '../default-select/default-select';
import { BreakpointObserver } from '@angular/cdk/layout';

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
  imports: [DefaultInput, DefaultSelect, NgTemplateOutlet],
})
export class  DefaultTable {
  readonly heading = input('');
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

  /* for mobile logic */
  /** Поле-идентификатор записи ('id'). Нужно для стабильного DOM и раскрытия карточек. */
  readonly trackKey = input('');
  /** Колонки для шапки карточки на мобилке. По умолчанию — первая колонка. */
  readonly titleKeys = input<string[]>([]);
  /** Как рисовать horizontal на узком экране. 'table' — оставить скролл. */
  readonly mobileLayout = input<'cards' | 'table'>('cards');
  /** Мобильные карточки сворачиваются. false — плоская карточка (настройки). */
  readonly collapsible = input(false, { transform: booleanAttribute });
  /** Упрощённое оформление мобильной таблицы без внешней рамки и отступов. */
  readonly isSimpleMode = input(false, { transform: booleanAttribute });

  private readonly isMobile = toSignal(
    inject(BreakpointObserver)
      .observe('(max-width: 900px)')
      .pipe(map((r) => r.matches)),
    { initialValue: false },
  );

  readonly layout = computed<'cards' | 'table'>(() =>
    this.isMobile() && this.mobileLayout() === 'cards' ? 'cards' : 'table',
  );

  readonly titleColumns = computed(() => {
    const keys = this.titleKeys();
    const cols = this.columns();
    return keys.length ? cols.filter((c) => keys.includes(c.key)) : cols.slice(0, 1);
  });

  readonly bodyColumns = computed(() => {
    const titles = new Set(this.titleColumns().map((c) => c.key));
    return this.columns().filter((c) => !titles.has(c.key));
  });

  /** Ключ раскрытой карточки (одна за раз). */
  readonly expanded = signal<unknown>(null);

  keyOf(item: DTItem, index: number): unknown {
    const k = this.trackKey();
    return k ? item[k] : index;
  }

  toggle(key: unknown): void {
    this.expanded.update((cur) => (cur === key ? null : key));
  }

  titleOf(item: DTItem): string {
    const c = this.titleColumns()[0];
    return c ? String(item[c.key] ?? '') : '';
  }

  subtitleOf(item: DTItem): string {
    return this.titleColumns()
      .slice(1)
      .map((c) => item[c.key])
      .filter((v) => v != null && v !== '')
      .join(' · ');
  }

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
    return this.layout() === 'cards' ? '100%' : (col.width ?? '100%');
  }

  onSelect(item: DTItem, col: DTColumn, value: string | number): void {
    const option = this.optionsOf(col).find((o) => String(o.value) === String(value));
    if (option) this.cellChange.emit({ item, key: col.key, value: option.value });
  }

  onInput(item: DTItem, col: DTColumn, value: string | number): void {
    this.cellChange.emit({ item, key: col.key, value });
  }
}