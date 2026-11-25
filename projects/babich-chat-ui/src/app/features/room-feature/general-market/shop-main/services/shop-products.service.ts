import { inject, Injectable, signal, computed } from '@angular/core';
import { FoodType, MOCK_GOODS, FOOD_TYPES, MockGood } from '../mock-goods';


@Injectable({ providedIn: 'root' })
export class ShopProductsService {
  private readonly selectedFoodType = signal<FoodType | 'all'>('all');

  readonly goods = MOCK_GOODS;
  readonly foodTypes = FOOD_TYPES;

  readonly selectedFoodTypeSignal = this.selectedFoodType.asReadonly();

  readonly filteredGoods = computed(() => {
    const filter = this.selectedFoodType();
    if (filter === 'all') return this.goods;
    return this.goods.filter((g) => g.foodType === filter);
  });

  setFoodType(type: FoodType | 'all'): void {
    this.selectedFoodType.set(type);
  }

  isAvailable(good: MockGood): boolean {
    return good.stock > 0;
  }
}
