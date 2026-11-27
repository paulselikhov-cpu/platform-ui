import { Component, computed, inject, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { ShopCartService } from '../../../services/shop-cart.service';
import { MockGood } from '../../../mock-goods';
import { ShopProductsService } from '../../../services/shop-products.service';
import { DefaultButtonComponent } from '../../../../../../../shared/components/buttons/default-button/default-button';
import { DefaultCard } from '../../../../../../../shared/components/default-card/default-card';

@Component({
  selector: 'app-shop-product-card',
  imports: [CurrencyPipe, DefaultButtonComponent, DefaultCard],
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
  readonly canIncrement = computed(
    () => this.products.isAvailable(this.good()) && this.cartQty() < this.good().stock,
  );

  onAdd(): void {
    if (!this.products.isAvailable(this.good())) return;
    this.addToCart.emit(this.good());
  }

  onQtyMinus(): void {
    const current = this.cartQty();
    if (current <= 1) {
      this.removeFromCart.emit(this.good());
    } else {
      this.cart.setQty(this.good().itemId, current - 1);
    }
  }

  onQtyPlus(): void {
    if (!this.canIncrement()) return;
    this.cart.setQty(this.good().itemId, this.cartQty() + 1);
  }
}
