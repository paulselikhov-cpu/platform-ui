import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ShopCartService } from '../../../services/shop-cart.service';
import { MockGood } from '../../../mock-goods';
import { ShopProductsService } from '../../../services/shop-products.service';

@Component({
  selector: 'app-shop-product-card',
  imports: [CurrencyPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
  standalone: true,
})
export class ShopProductCardComponent {
  readonly products = inject(ShopProductsService);
  readonly cart = inject(ShopCartService);

  readonly good = input.required<MockGood>();

  readonly addToCart = output<MockGood>();
  readonly removeFromCart = output<MockGood>();

  readonly cartItems = this.cart.itemsList;

  readonly inCart = computed(() => this.cartItems().some((i) => i.itemId === this.good().itemId));
  readonly cartQty = computed(() => {
    const item = this.cartItems().find((i) => i.itemId === this.good().itemId);
    return item ? item.qty : 0;
  });

  constructor() {
    effect(() => {
      // корзина привязывается в родителе, здесь только чтение
    });
  }

  onAdd(): void {
    this.addToCart.emit(this.good());
  }

  onRemove(): void {
    this.removeFromCart.emit(this.good());
  }

  onQtyMinus(): void {
    const current = this.cartQty();
    if (current <= 1) {
      this.removeFromCart.emit(this.good());
    } else {
      this.cart.add({
        itemId: this.good().itemId,
        name: this.good().name,
        price: this.good().price,
        qty: -1,
        image: this.good().image,
        energy: this.good().energy,
      });
    }
  }

  onQtyPlus(): void {
    this.cart.add({
      itemId: this.good().itemId,
      name: this.good().name,
      price: this.good().price,
      qty: 1,
      image: this.good().image,
      energy: this.good().energy,
    });
  }
}
