import { Component, input } from '@angular/core';

export type DefaultListLayout = 'column' | 'grid';

@Component({
  selector: 'app-default-list',
  standalone: true,
  templateUrl: './default-list.html',
  styleUrl: './default-list.scss',
})
export class DefaultList {
  readonly layout = input<DefaultListLayout>('column');
}
