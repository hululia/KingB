export interface Ingredient {
  id: string;
  name: string;
  image: string;
  color: string;
}

export interface RecipeStep {
  id: string;
  description: string;
  requiredIngredientId: string;
}

export interface Recipe {
  id: string;
  name: string;
  image: string;
  description: string;
  steps: RecipeStep[];
}

export const INGREDIENTS: Record<string, Ingredient> = {
  rice: { id: 'rice', name: '醋饭', image: '/assets/misc/placeholder.png', color: 'bg-white' },
  fish: { id: 'fish', name: '生鱼片', image: '/assets/misc/placeholder.png', color: 'bg-red-400' },
  seaweed: { id: 'seaweed', name: '海苔', image: '/assets/misc/placeholder.png', color: 'bg-gray-800' },
  wasabi: { id: 'wasabi', name: '芥末', image: '/assets/misc/placeholder.png', color: 'bg-green-500' },
  bread: { id: 'bread', name: '吐司', image: '/assets/ingredients/bread.png', color: 'bg-amber-100' },
  cheese: { id: 'cheese', name: '芝士', image: '/assets/ingredients/cheese.png', color: 'bg-yellow-400' },
  ham: { id: 'ham', name: '火腿', image: '/assets/ingredients/meat.png', color: 'bg-pink-300' },
  lettuce: { id: 'lettuce', name: '生菜', image: '/assets/ingredients/lettuce.png', color: 'bg-green-400' },
};

export const RECIPES: Recipe[] = [
  {
    id: 'sushi',
    name: '寿司',
    image: '/assets/misc/placeholder.png',
    description: '新鲜美味的握寿司',
    steps: [
      { id: 's1', description: '铺上海苔', requiredIngredientId: 'seaweed' },
      { id: 's2', description: '放上醋饭', requiredIngredientId: 'rice' },
      { id: 's3', description: '抹点芥末', requiredIngredientId: 'wasabi' },
      { id: 's4', description: '盖上鲜鱼', requiredIngredientId: 'fish' },
    ],
  },
  {
    id: 'sandwich',
    name: '芝士三明治',
    image: '/assets/misc/placeholder.png',
    description: '经典芝士火腿三明治',
    steps: [
      { id: 'w1', description: '放第一片吐司', requiredIngredientId: 'bread' },
      { id: 'w2', description: '铺上生菜', requiredIngredientId: 'lettuce' },
      { id: 'w3', description: '叠上火腿', requiredIngredientId: 'ham' },
      { id: 'w4', description: '放上芝士', requiredIngredientId: 'cheese' },
      { id: 'w5', description: '盖上第二片吐司', requiredIngredientId: 'bread' },
    ],
  },
];
