import { Component, computed, effect, inject, input } from '@angular/core';
import { ShopCartService } from '../../services/shop-cart.service';
import { FoodType, MockGood, FOOD_TYPE_LABELS } from '../../mock-goods';
import { ShopProductCardComponent } from './product-card/product-card.component';
import { ShopProductsService } from '../../services/shop-products.service';
import { DefaultTabsSet, DefaultTabOption } from '../../../../../../shared/components/default-tabs-set/default-tabs-set';
import { DefaultSelect, DefaultSelectOption } from '../../../../../../shared/components/default-select/default-select';

@Component({
  selector: 'app-shop-products-panel',
  imports: [ShopProductCardComponent, DefaultTabsSet, DefaultSelect],
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
  readonly foodTypeOptions = computed<DefaultSelectOption[]>(() => [
    ...this.foodTypes.map((type) => ({ value: type, label: this.foodTypeLabels[type] })),
    { value: 'all', label: 'Все' },
  ]);
  readonly foodTypeTabs = computed<DefaultTabOption[]>(() =>
    this.foodTypeOptions().map((option) => ({ id: String(option.value), label: option.label })),
  );

  constructor() {
    effect(() => {
      const id = this.characterId();
      if (id !== null) {
        this.cart.bind(id);
      }
    });
  }

  onFilter(type: string): void {
    if (type === 'all') {
      this.products.setFoodType(type);
    } else if ((this.foodTypes as readonly string[]).includes(type)) {
      this.products.setFoodType(type as FoodType);
    }
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
