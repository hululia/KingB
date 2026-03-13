/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Coins, 
  Pause, 
  Play, 
  RotateCcw, 
  Flame, 
  Utensils, 
  CheckCircle2, 
  XCircle,
  ChefHat,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { 
  IngredientId, 
  IngredientState, 
  Ingredient, 
  Customer, 
  Station, 
  RECIPES, 
  INGREDIENT_DATA,
  LEVELS,
  CUSTOMER_IMAGES,
  CUSTOMER_COLORS
} from './types';

// ==========================================
// Vite 图片 Import 区域 (请确保路径与你的文件夹结构完全匹配)
// ==========================================
import bgImage from './assets/backgrounds/background.png';
import counterWoodImage from './assets/backgrounds/counter_wood.png';
import plateImage from './assets/backgrounds/plate.png'; 
import stationFryerImage from './assets/machines/station_fryer.png'; 
import stationGrillImage from './assets/machines/station_grill.png'; 
import stationSauceImage from './assets/machines/station_sauce.png';

const MAX_CUSTOMERS = 3;

export default function App() {
  // Game State
  const [gameState, setGameState] = useState<'START' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'LEVEL_COMPLETE'>('START');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [coins, setCoins] = useState(0);

  // Entities
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stations, setStations] = useState<Station[]>([
    { id: 'grill-1', type: 'STOVE', content: null, isCooking: false },
    { id: 'fryer-1', type: 'STOVE', content: null, isCooking: false },
    { id: 'prep-1', type: 'PREP', content: null, isCooking: false },
    { id: 'plate-1', type: 'PLATE', content: [], isCooking: false },
  ]);
  const [heldItem, setHeldItem] = useState<Ingredient | Ingredient[] | null>(null);

  const currentLevel = LEVELS[currentLevelIdx];

  // Initialize Game
  const startLevel = (idx: number) => {
    const level = LEVELS[idx];
    setCurrentLevelIdx(idx);
    setGameState('PLAYING');
    setTimeLeft(level.duration);
    setCoins(0);
    setCustomers([]);
    setStations([
      { id: 'grill-1', type: 'STOVE', content: null, isCooking: false },
      { id: 'fryer-1', type: 'STOVE', content: null, isCooking: false },
        { id: 'prep-1', type: 'PREP', content: null, isCooking: false },
      { id: 'plate-1', type: 'PLATE', content: [], isCooking: false },
    ]);
    setHeldItem(null);
  };

  // Game Loop
  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const interval = setInterval(() => {
      // 1. Update Time
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (coins >= currentLevel.targetScore) {
            setGameState('LEVEL_COMPLETE');
          } else {
            setGameState('GAMEOVER');
          }
          return 0;
        }
        return prev - 1;
      });

      // 2. Update Cooking & Prep Stations
      setStations(prev => prev.map(station => {
        if ((station.type === 'STOVE' || station.type === 'PREP') && station.content && !Array.isArray(station.content)) {
          const ingredient = station.content as Ingredient;
          if (ingredient.state === IngredientState.COOKING) {
            const cookTime = INGREDIENT_DATA[ingredient.id].cookTime;
            const newProgress = ingredient.progress + (100 / (cookTime * 10)); // 10 ticks per second

            if (newProgress >= 100) {
              return {
                ...station,
                content: { ...ingredient, state: IngredientState.COOKED, progress: 100 }
              };
            }
            return {
              ...station,
              content: { ...ingredient, progress: newProgress }
            };
          }
        }
        return station;
      }));

      // 3. Update Customers & Orders
      setCustomers(prev => {
        const updated = prev.map(customer => {
          if (customer.order) {
            const newTime = customer.order.remainingTime - 0.1;
            if (newTime <= 0) {
              return { ...customer, order: null, patience: 0 }; // Customer leaves
            }
            return {
              ...customer,
              order: { ...customer.order, remainingTime: newTime },
              patience: (newTime / customer.order.totalTime) * 100
            };
          }
          return customer;
        });

        // Remove customers who left
        return updated.filter(c => c.order !== null || Math.random() > 0.99);
      });

      // 4. Spawn Customers
      setCustomers(prev => {
        if (prev.length < MAX_CUSTOMERS && Math.random() < currentLevel.customerSpawnRate) {
          const recipeIds = currentLevel.availableRecipes;
          const randomRecipe = RECIPES[recipeIds[Math.floor(Math.random() * recipeIds.length)]];
          const typeIndex = Math.floor(Math.random() * CUSTOMER_IMAGES.length);
          const randomCustomerImg = CUSTOMER_IMAGES[typeIndex];
          const randomCustomerColor = CUSTOMER_COLORS[typeIndex];

          const newCustomer: Customer = {
            id: Math.random().toString(36).substr(2, 9),
            slotIndex: [0, 1, 2].find(i => !prev.some(c => c.slotIndex === i)) ?? 0,
            patience: 100,
            image: randomCustomerImg,
            color: randomCustomerColor,
            order: {
              id: Math.random().toString(36).substr(2, 9),
              recipeId: randomRecipe.id,
              remainingTime: currentLevel.orderTime,
              totalTime: currentLevel.orderTime
            }
          };
          return [...prev, newCustomer];
        }
        return prev;
      });

    }, 100);

    return () => clearInterval(interval);
  }, [gameState, coins, currentLevel]);

  // Interactions
  const takeIngredient = (id: IngredientId) => {
    const newIngredient: Ingredient = {
      id,
      name: INGREDIENT_DATA[id].name,
      state: IngredientState.RAW,
      progress: 0
    };

    // 1. If holding a plate, add ingredient directly to it
    if (heldItem && Array.isArray(heldItem)) {
      if (INGREDIENT_DATA[id].cookTime === 0) {
        setHeldItem([...heldItem, newIngredient]);
        return;
      }
    }

    // 2. Auto-place no-cook items into a plate station
    if (id === 'bread' || id === 'cheese' || id === 'lettuce' || id === 'pickles') {
      const plateIndex = stations.findIndex(s => s.type === 'PLATE');
      if (plateIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          const currentPlate = Array.isArray(updated[plateIndex].content) 
            ? updated[plateIndex].content as Ingredient[] 
            : [];
          updated[plateIndex] = {
            ...updated[plateIndex],
            content: [...currentPlate, newIngredient]
          };
          return updated;
        });
        return;
      }
    }

    // 3. Auto-place into prep station
    if (id === 'tomato' || id === 'onion') {
      const emptyPrepIndex = stations.findIndex(s => s.type === 'PREP' && !s.content);
      if (emptyPrepIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          updated[emptyPrepIndex] = {
            ...updated[emptyPrepIndex],
            content: { ...newIngredient, state: IngredientState.COOKING }
          };
          return updated;
        });
        return;
      }
    }

    // 4. Auto-place into stove
    if (INGREDIENT_DATA[id].cookTime > 0 && id !== 'tomato' && id !== 'onion') {
      const emptyStoveIndex = stations.findIndex(s => s.type === 'STOVE' && !s.content);
      if (emptyStoveIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          updated[emptyStoveIndex] = {
            ...updated[emptyStoveIndex],
            content: { ...newIngredient, state: IngredientState.COOKING }
          };
          return updated;
        });
        return; 
      }
    }

    // 5. Fallback
    if (!heldItem) {
      setHeldItem(newIngredient);
    }
  };

  const onDishServed = (score: number) => {
    setCoins(prev => prev + score);
    if (currentLevel.id === 21) {
      setTimeLeft(prev => prev + 5);
    }
  };

  const interactWithStation = (stationId: string) => {
    setStations(prev => {
      const station = prev.find(s => s.id === stationId);
      if (!station) return prev;

      const newStations = [...prev];
      const index = prev.findIndex(s => s.id === stationId);

      // 0. Global Auto-Placing for Cooked/Prepped Items
      if ((station.type === 'STOVE' || station.type === 'PREP') && station.content && !Array.isArray(station.content)) {
        const ingredient = station.content as Ingredient;
        if (ingredient.state === IngredientState.COOKED) {
          if (heldItem && Array.isArray(heldItem)) {
            setHeldItem([...heldItem, ingredient]);
            newStations[index] = { ...station, content: null };
            return newStations;
          }
          const plateIndex = stations.findIndex(s => s.type === 'PLATE');
          if (plateIndex !== -1) {
            const currentPlate = Array.isArray(newStations[plateIndex].content) 
              ? newStations[plateIndex].content as Ingredient[] 
              : [];
            newStations[plateIndex] = {
              ...newStations[plateIndex],
              content: [...currentPlate, ingredient]
            };
            newStations[index] = { ...station, content: null };

            if (heldItem && !Array.isArray(heldItem)) {
              const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0;
              const isPrepItem = heldItem.id === 'tomato' || heldItem.id === 'onion';

              if ((station.type === 'STOVE' && isCookable && !isPrepItem) || 
                  (station.type === 'PREP' && isPrepItem)) {
                newStations[index] = { 
                  ...newStations[index], 
                  content: { ...heldItem, state: IngredientState.COOKING } 
                };
                setHeldItem(null);
              }
            }
            return newStations;
          }
        }
      }

      // 1. If holding a single item
      if (heldItem && !Array.isArray(heldItem)) {
        const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0;
        const isPrepItem = heldItem.id === 'tomato' || heldItem.id === 'onion';

        if (station.type === 'STOVE' && !isPrepItem) {
          if (!station.content && isCookable) {
            newStations[index] = { 
              ...station, 
              content: { ...heldItem, state:
