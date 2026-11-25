import { inject, Injectable, signal, computed } from '@angular/core';

export interface CartItem {
  itemId: string | number;
  name: string;
  price: number;
  qty: number;
  image?: string;
  energy?: number;
}

/**
 * Корзина пользователя. Состояние в localStorage по ключу
 * `babich_market_cart_{characterId}`. Не шарится между персонажами.
 */
@Injectable({ providedIn: 'root' })
export class ShopCartService {
  private readonly characterId = signal<number | null>(null);

  private items = signal<CartItem[]>([]);

  readonly itemsList = this.items.asReadonly();

  readonly total = computed(() =>
    this.items().reduce((sum, it) => sum + it.price * it.qty, 0)
  );

  readonly isEmpty = computed(() => this.items().length === 0);

  /** Привязать корзину к персонажу (загрузить из localStorage). */
  bind(characterId: number): void {
    this.characterId.set(characterId);
    this.items.set(this.loadFromStorage(characterId));
  }

  /** Отвязать персонажа (очистить состояние в памяти, данные в localStorage остаются). */
  unbind(): void {
    this.characterId.set(null);
    this.items.set([]);
  }

  add(item: CartItem): void {
    const id = this.characterId();
    if (id === null) return;
    const existing = this.items().find((i) => i.itemId === item.itemId);
    if (existing) {
      existing.qty += item.qty;
    } else {
      this.items.set([...this.items(), { ...item }]);
    }
    this.saveToStorage(id);
  }

  remove(itemId: string | number): void {
    const id = this.characterId();
    if (id === null) return;
    this.items.set(this.items().filter((i) => i.itemId !== itemId));
    this.saveToStorage(id);
  }

  setQty(itemId: string | number, qty: number): void {
    const id = this.characterId();
    if (id === null) return;
    if (qty <= 0) {
      this.remove(itemId);
      return;
    }
    this.items.set(
      this.items().map((i) => (i.itemId === itemId ? { ...i, qty } : i))
    );
    this.saveToStorage(id);
  }

  clear(): void {
    const id = this.characterId();
    if (id === null) return;
    this.items.set([]);
    this.saveToStorage(id);
  }

  private key(characterId: number): string {
    return `babich_market_cart_${characterId}`;
  }

  private loadFromStorage(characterId: number): CartItem[] {
    try {
      const raw = localStorage.getItem(this.key(characterId));
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveToStorage(characterId: number): void {
    try {
      localStorage.setItem(this.key(characterId), JSON.stringify(this.items()));
    } catch {
      // ignore quota errors
    }
  }
}
