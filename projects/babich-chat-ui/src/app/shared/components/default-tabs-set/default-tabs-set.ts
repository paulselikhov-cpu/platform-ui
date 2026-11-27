import { Component, input, output } from '@angular/core';

export interface DefaultTabOption {
  id: string;
  label: string;
  disabled?: boolean;
}

export type DefaultTabsSetSize = 'xs' | 's' | 'm' | 'l';
export type DefaultTabsSetType = 'primary' | 'secondary' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'default-tabs-set',
  standalone: true,
  templateUrl: './default-tabs-set.html',
  styleUrl: './default-tabs-set.scss',
  host: {
    '[attr.data-size]': 'size()',
    '[attr.data-type]': 'type()',
    '[class.is-gap]': 'isGap()',
  },
})
export class DefaultTabsSet {
  readonly tabs = input<DefaultTabOption[]>([]);
  readonly activeTab = input('');
  readonly type = input<DefaultTabsSetType>('secondary');
  readonly size = input<DefaultTabsSetSize>('m');
  readonly isGap = input(false);
  readonly disabled = input(false);
  readonly ariaLabel = input('Вкладки');

  readonly activeTabChange = output<string>();
}
