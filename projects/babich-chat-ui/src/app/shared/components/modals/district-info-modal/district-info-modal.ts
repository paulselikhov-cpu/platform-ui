import { Component, output, signal } from '@angular/core';
import { WindowModal } from '../window-modal/window-modal';

@Component({
  selector: 'app-district-info-modal',
  templateUrl: './district-info-modal.html',
  styleUrl: './district-info-modal.scss',
  standalone: true,
  imports: [WindowModal],
})
export class DistrictInfoModal {
  readonly closeModal = output<void>();
  readonly currentPage = signal<'menu' | 'rules' | 'police' | 'layer'>('menu');

  goBack(): void {
    this.currentPage.set('menu');
  }
}