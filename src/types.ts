/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type IngredientId = 'meat' | 'tomato' | 'bread' | 'lettuce' | 'cheese' | 'onion' | 'pickles' | 'egg';

export enum IngredientState {
  RAW = 'RAW',
  COOKING = 'COOKING',
  COOKED = 'COOKED',
  BURNT = 'BURNT'
}

export interface Ingredient {
  id: IngredientId;
  name: string;
  state: IngredientState;
  progress: number; // 0 to 100
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: IngredientId[];
  score: number;
  image: string;
}

export interface Order {
  id: string;
  recipeId: string;
  remainingTime: number;
  totalTime: number;
}

export interface Customer {
  id: string;
  order: Order | null;
  patience: number; // 0 to 100
  slotIndex: number;
  image: string;
  color: string;
}

export interface Station {
  id: string;
  type: 'STOVE' | 'PREP' | 'PLATE';
  content: Ingredient | Ingredient[] | null;
  isCooking: boolean;
}

export interface LevelConfig {
  id: number;
  name: string;
  duration: number;
  targetScore: number;
  availableRecipes: string[];
  customerSpawnRate: number; // 0 to 1
  orderTime: number;
  unlockedIngredients: IngredientId[];
}

export const INGREDIENT_DATA: Record<IngredientId, { name: string; cookTime: number; image: string }> = {
  'meat': { name: 'Meat', cookTime: 5, image: '/assets/ingredients/meat.png'},
  'tomato': { name: 'Tomato', cookTime: 2, image: '/assets/ingredients/tomato.png'},
  'bread': { name: 'Bread', cookTime: 0, image: '/assets/ingredients/bread.png' },
  'lettuce': { name: 'Lettuce', cookTime: 0, image: '/assets/ingredients/lettuce.png' },
  'cheese': { name: 'Cheese', cookTime: 0, image: '/assets/ingredients/cheese.png' },
  'onion': { name: 'Onion', cookTime: 2, image: '/assets/ingredients/onion.png' },
  'pickles': { name: 'Pickles', cookTime: 0, image: '/assets/ingredients/pickles.png' },
  'egg': { name: 'Egg', cookTime: 3, image: '/assets/ingredients/egg.png' }
};

export const RECIPES: Record<string, Recipe> = {
  'burger': {
    id: 'burger',
    name: 'Burger',
    ingredients: ['bread', 'meat', 'bread'],
    score: 100,
    image: '/assets/recipes/recipe_burger.png' },
  'cheeseburger': {
    id: 'cheeseburger',
    name: 'Cheese Burger',
    ingredients: ['bread', 'meat', 'cheese', 'bread'],
    score: 150,
    image: '/assets/ingredients/recipe_cheeseburger.png' },
  'salad': {
    id: 'salad',
    name: 'Salad',
    ingredients: ['tomato', 'lettuce'],
    score: 80,
    image: '/assets/recipes/recipe_salad.png' },
  'egg_sandwich': {
    id: 'egg_sandwich',
    name: 'Egg Sandwich',
    ingredients: ['bread', 'egg', 'bread'],
    score: 110,
    image: '/assets/recipes/sandwich.png' },
  'deluxe_burger': {
    id: 'deluxe_burger',
    name: 'Deluxe Burger',
    ingredients: ['bread', 'meat', 'cheese', 'lettuce', 'tomato', 'bread'],
    score: 250,
    image: '/assets/recipes/recipe_deluxe_burger.png' }
};

export const CUSTOMER_IMAGES = [
  '/assets/customers/customer_1.png',
  '/assets/customers/customer_2.png',
  '/assets/customers/customer_3.png',
  '/assets/customers/customer_4.png',
  '/assets/customers/customer_5.png',
  '/assets/customers/customer_6.png'
];

export const CUSTOMER_COLORS = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEEAD', // Yellow
  '#D4A5A5'  // Pink
];


export const LEVELS: LevelConfig[] = [
  ...Array.from({ length: 20 }, (_, i) => {
    const levelNum = i + 1;
    return {
      id: levelNum,
      name: `Level ${levelNum}`,
      duration: Math.round(Math.max(120, 180 - (levelNum * 2)) * 1.2),
      targetScore: 200 + (levelNum * 100),
      availableRecipes: levelNum < 3 ? ['burger'] : 
                       levelNum < 6 ? ['burger', 'salad'] : 
                       levelNum < 10 ? ['burger', 'salad', 'cheeseburger'] : 
                       levelNum < 15 ? ['burger', 'salad', 'cheeseburger', 'egg_sandwich'] : 
                       ['burger', 'salad', 'cheeseburger', 'egg_sandwich', 'deluxe_burger'],
      customerSpawnRate: 0.15 + (levelNum * 0.02),
      orderTime: Math.max(30, 60 - levelNum),
      unlockedIngredients: (levelNum < 3 ? ['meat', 'bread', 'lettuce'] :
                          levelNum < 6 ? ['meat', 'bread', 'lettuce', 'tomato'] :
                          levelNum < 10 ? ['meat', 'bread', 'lettuce', 'tomato', 'cheese'] :
                          levelNum < 15 ? ['meat', 'bread', 'lettuce', 'tomato', 'cheese', 'egg'] :
                          ['meat', 'bread', 'lettuce', 'tomato', 'cheese', 'egg', 'onion', 'pickles']) as IngredientId[]
    };
  }),
  {
    id: 21,
    name: "Endless Burger Mode",
    duration: 120, // 2 minutes
    targetScore: 999999, // High target for endless feel
    availableRecipes: ['burger', 'cheeseburger', 'deluxe_burger'],
    customerSpawnRate: 0.6,
    orderTime: 45,
    unlockedIngredients: ['meat', 'bread', 'lettuce', 'tomato', 'cheese', 'onion', 'pickles'] as IngredientId[]
  }
];
