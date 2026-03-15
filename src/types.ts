/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ==========================================
// 1. Vite 
// ==========================================

// Ingredients (食材)
import imgMeat from './assets/ingredients/meat.png';
import imgRawMeat from './assets/ingredients/rawmeat.png';
import imgTomato from './assets/ingredients/tomato.png';
import imgBread from './assets/ingredients/bread.png';
import imgLettuce from './assets/ingredients/lettuce.png';
import imgCheese from './assets/ingredients/cheese.png';
import imgOnion from './assets/ingredients/onion.png';
import imgPickles from './assets/ingredients/pickles.png';
import imgEgg from './assets/ingredients/egg.png';

// Recipes (食谱)
import imgRecipeBurger from './assets/recipes/recipe_burger.png';
import imgRecipeCheeseburger from './assets/ingredients/recipe_cheeseburger.png'; // 注意：这里你原代码写的是 ingredients 文件夹
import imgRecipeSalad from './assets/recipes/recipe_salad.png';
import imgRecipeEggSandwich from './assets/recipes/sandwich.png';
import imgRecipeDeluxeBurger from './assets/recipes/recipe_deluxe_burger.png';

// Customers (顾客)
import imgCustomer1 from './assets/customers/customer_1.png';
import imgCustomer2 from './assets/customers/customer_2.png';
import imgCustomer3 from './assets/customers/customer_3.png';
import imgCustomer4 from './assets/customers/customer_4.png';
import imgCustomer5 from './assets/customers/customer_5.png';
import imgCustomer6 from './assets/customers/customer_6.png';


// ==========================================
// 2. 类型定义与游戏数据
// ==========================================

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
  /** seconds elapsed while actively cooking/prepping */
  cookElapsed?: number;
  /** seconds elapsed after COOKED but still left on heat (burn timer) */
  holdElapsed?: number;
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
  'meat': { name: 'Meat', cookTime: 5, image: imgRawMeat },
  'tomato': { name: 'Tomato', cookTime: 2, image: imgTomato },
  'bread': { name: 'Bread', cookTime: 0, image: imgBread },
  'lettuce': { name: 'Lettuce', cookTime: 0, image: imgLettuce },
  'cheese': { name: 'Cheese', cookTime: 0, image: imgCheese },
  'onion': { name: 'Onion', cookTime: 2, image: imgOnion },
  'pickles': { name: 'Pickles', cookTime: 0, image: imgPickles },
  'egg': { name: 'Egg', cookTime: 3, image: imgEgg }
};

export const RECIPES: Record<string, Recipe> = {
  'burger': {
    id: 'burger',
    name: 'Burger',
    ingredients: ['bread', 'meat', 'bread'],
    score: 100,
    image: imgRecipeBurger
  },
  'cheeseburger': {
    id: 'cheeseburger',
    name: 'Cheese Burger',
    ingredients: ['bread', 'meat', 'cheese', 'bread'],
    score: 150,
    image: imgRecipeCheeseburger 
  },
  'salad': {
    id: 'salad',
    name: 'Salad',
    ingredients: ['tomato', 'lettuce'],
    score: 80,
    image: imgRecipeSalad 
  },
  'egg_sandwich': {
    id: 'egg_sandwich',
    name: 'Egg Sandwich',
    ingredients: ['bread', 'egg', 'bread'],
    score: 110,
    image: imgRecipeEggSandwich 
  },
  'deluxe_burger': {
    id: 'deluxe_burger',
    name: 'Deluxe Burger',
    ingredients: ['bread', 'meat', 'cheese', 'lettuce', 'tomato', 'bread'],
    score: 250,
    image: imgRecipeDeluxeBurger 
  }
};

export const CUSTOMER_IMAGES = [
  imgCustomer1,
  imgCustomer2,
  imgCustomer3,
  imgCustomer4,
  imgCustomer5,
  imgCustomer6
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
      duration: Math.round(
        Math.max(120, 180 - (levelNum * 2)) * 1.2 * (levelNum >= 2 && levelNum <= 20 ? 1.4 : 1),
      ),
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
