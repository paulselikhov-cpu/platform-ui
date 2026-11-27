import type { InputSignal } from '@angular/core';

export type DefaultSize = 'xs' | 's' | 'm' | 'l';

export interface DefaultBase<TSize extends string = DefaultSize> {
  readonly size: InputSignal<TSize>;
}
