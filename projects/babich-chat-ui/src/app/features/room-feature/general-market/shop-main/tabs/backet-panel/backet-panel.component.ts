import { Component, effect, inject, input, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ShopCartService, CartItem } from '../../services/shop-cart.service';
import { MOCK_GOODS } from '../../mock-goods';
import { ConfirmModal } from '../../../../../../shared/components/modals/confirm-modal/confirm-modal';

@Component({
  selector: 'app-backet-panel',
  imports: [ConfirmModal, CurrencyPipe],
  templateUrl: './backet-panel.html',
  styleUrl: './backet-panel.scss',
  standalone: true,
})
export class BacketPanelComponent {
  readonly cart = inject(ShopCartService);

  readonly roomId = input.required<number>();
  readonly locationId = input.required<number>();
  readonly characterId = input.required<number>();

  readonly items = this.cart.itemsList;
  readonly total = this.cart.total;
  readonly isEmpty = this.cart.isEmpty;

  /** Товары из мок-каталога (для отображения доступности/остатка). */
  readonly goods = MOCK_GOODS;

  readonly isConfirmOpen = signal(false);

  constructor() {
    effect(() => {
      const id = this.characterId();
      if (id !== null) {
        this.cart.bind(id);
      }
    });
  }

  /** Найти товар в мок-каталоге по id (для отображения остатка). */
  goodById(itemId: CartItem['itemId']) {
    return this.goods.find((g) => g.itemId === itemId);
  }

  onClear(): void {
    this.cart.clear();
  }

  onPay(): void {
    this.isConfirmOpen.set(true);
  }

  onConfirmPay(): void {
    this.isConfirmOpen.set(false);
    // Здесь в будущем будет вызов бэкенд-транзакции оплаты.
    // На старте — мок: просто очищаем корзину.
    this.cart.clear();
  }

  onCancelPay(): void {
    this.isConfirmOpen.set(false);
  }
}
