import { Component, output } from '@angular/core';
import { WindowModal } from '../window-modal/window-modal';

@Component({
  selector: 'app-applications-modal',
  templateUrl: './applications-modal.html',
  styleUrl: './applications-modal.scss',
  standalone: true,
  imports: [WindowModal],
})
export class ApplicationsModal {
  readonly closeModal = output<void>();

  // Фейковые заявки
  readonly applications = [
    { id: 1, title: 'Покупка квартиры', address: 'ул. Ленина, д. 5, кв. 12', status: 'pending' },
    { id: 2, title: 'Аренда офиса', address: 'пр. Мира, д. 10', status: 'approved' },
    { id: 3, title: 'Регистрация участка', address: 'ул. Садовая, д. 3', status: 'rejected' },
  ];
}