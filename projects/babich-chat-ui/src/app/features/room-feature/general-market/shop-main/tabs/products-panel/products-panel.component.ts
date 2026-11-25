import { Component, effect, inject, input, signal } from '@angular/core';
import { ShopCartService } from '../../services/shop-cart.service';
import { MockGood, FOOD_TYPE_LABELS } from '../../mock-goods';
import { ShopProductCardComponent } from './product-card/product-card.component';
import { ShopProductsService } from '../../services/shop-products.service';

@Component({
  selector: 'app-shop-products-panel',
  imports: [ShopProductCardComponent],
  templateUrl: './products-panel.html',
  styleUrl: './products-panel.scss',
  standalone: true,
})
export class ShopProductsPanelComponent {
  readonly products = inject(ShopProductsService);
  readonly cart = inject(ShopCartService);

  readonly roomId = input.required<number>();
  readonly locationId = input.required<number>();
  readonly characterId = input.required<number>();

  readonly goods = this.products.filteredGoods;
  readonly foodTypes = this.products.foodTypes;
  readonly foodTypeLabels = FOOD_TYPE_LABELS;
  readonly selectedFoodType = this.products.selectedFoodTypeSignal;

  constructor() {
    effect(() => {
      const id = this.characterId();
      if (id !== null) {
        this.cart.bind(id);
      }
    });
  }

  onFilter(type: string): void {
    this.products.setFoodType(type as any);
  }

  onAddToCart(good: MockGood): void {
    this.cart.add({
      itemId: good.itemId,
      name: good.name,
      price: good.price,
      qty: 1,
      image: good.image,
      energy: good.energy,
    });
  }

  onRemoveFromCart(good: MockGood): void {
    this.cart.remove(good.itemId);
  }
}
