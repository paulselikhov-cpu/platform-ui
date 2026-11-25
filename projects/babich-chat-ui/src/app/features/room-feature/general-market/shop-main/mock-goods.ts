export type FoodType = 'meat' | 'vegetable' | 'drink' | 'dairy' | 'bakery';

export interface MockGood {
  itemId: string | number;
  name: string;
  price: number;
  energy: number;
  image: string;
  stock: number;
  /** locationItem.type — например 'food'. */
  type: string;
  /** food.type — справочник на бэкенде: мясо, овощи, напитки и т.д. */
  foodType?: FoodType;
}

/** Моковый каталог товаров магазина (заглушка до реализации бэкенда). */
export const MOCK_GOODS: MockGood[] = [
  {
    itemId: 'apple',
    name: 'Яблоко',
    price: 10,
    energy: 5,
    image: '🍎',
    stock: 17,
    type: 'food',
    foodType: 'vegetable',
  },
  {
    itemId: 'bread',
    name: 'Батон',
    price: 15,
    energy: 12,
    image: '🍞',
    stock: 8,
    type: 'food',
    foodType: 'bakery',
  },
  {
    itemId: 'milk',
    name: 'Молоко',
    price: 20,
    energy: 8,
    image: '🥛',
    stock: 5,
    type: 'food',
    foodType: 'dairy',
  },
  {
    itemId: 'cheese',
    name: 'Сыр',
    price: 40,
    energy: 20,
    image: '🧀',
    stock: 3,
    type: 'food',
    foodType: 'dairy',
  },
  {
    itemId: 'beef',
    name: 'Говядина',
    price: 60,
    energy: 30,
    image: '🥩',
    stock: 4,
    type: 'food',
    foodType: 'meat',
  },
  {
    itemId: 'water',
    name: 'Вода',
    price: 8,
    energy: 3,
    image: '💧',
    stock: 20,
    type: 'food',
    foodType: 'drink',
  },
];

/** Доступные значения фильтра foodType. */
export const FOOD_TYPES: FoodType[] = ['meat', 'vegetable', 'drink', 'dairy', 'bakery'];

export const FOOD_TYPE_LABELS: Record<FoodType, string> = {
  meat: 'Мясо',
  vegetable: 'Овощи',
  drink: 'Напитки',
  dairy: 'Молочное',
  bakery: 'Выпечка',
};
