/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Timer, 
  Coins, 
  Play, 
  RotateCcw, 
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
  CUSTOMER_IMAGES
} from './types';

// ==========================================
// Vite 图片 Import 区域
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
          
          const newCustomer: Customer = {
            id: Math.random().toString(36).substr(2, 9),
            slotIndex: [0, 1, 2].find(i => !prev.some(c => c.slotIndex === i)) ?? 0,
            patience: 100,
            image: randomCustomerImg,
            color: '#FFFFFF', // Dummy color
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

  // Interactions (Logic remains unchanged)
  const takeIngredient = (id: IngredientId) => {
    const newIngredient: Ingredient = { id, name: INGREDIENT_DATA[id].name, state: IngredientState.RAW, progress: 0 };
    if (heldItem && Array.isArray(heldItem)) { if (INGREDIENT_DATA[id].cookTime === 0) { setHeldItem([...heldItem, newIngredient]); return; } }
    if (id === 'bread' || id === 'cheese' || id === 'lettuce' || id === 'pickles') { const plateIndex = stations.findIndex(s => s.type === 'PLATE'); if (plateIndex !== -1) { setStations(prev => { const updated = [...prev]; const currentPlate = Array.isArray(updated[plateIndex].content) ? updated[plateIndex].content as Ingredient[] : []; updated[plateIndex] = { ...updated[plateIndex], content: [...currentPlate, newIngredient] }; return updated; }); return; } }
    if (id === 'tomato' || id === 'onion') { const emptyPrepIndex = stations.findIndex(s => s.type === 'PREP' && !s.content); if (emptyPrepIndex !== -1) { setStations(prev => { const updated = [...prev]; updated[emptyPrepIndex] = { ...updated[emptyPrepIndex], content: { ...newIngredient, state: IngredientState.COOKING } }; return updated; }); return; } }
    if (INGREDIENT_DATA[id].cookTime > 0 && id !== 'tomato' && id !== 'onion') { const emptyStoveIndex = stations.findIndex(s => s.type === 'STOVE' && !s.content); if (emptyStoveIndex !== -1) { setStations(prev => { const updated = [...prev]; updated[emptyStoveIndex] = { ...updated[emptyStoveIndex], content: { ...newIngredient, state: IngredientState.COOKING } }; return updated; }); return; } }
    if (!heldItem) { setHeldItem(newIngredient); }
  };
  const onDishServed = (score: number) => { setCoins(prev => prev + score); if (currentLevel.id === 21) { setTimeLeft(prev => prev + 5); } };
  const interactWithStation = (stationId: string) => { setStations(prev => { const station = prev.find(s => s.id === stationId); if (!station) return prev; const newStations = [...prev]; const index = prev.findIndex(s => s.id === stationId); if ((station.type === 'STOVE' || station.type === 'PREP') && station.content && !Array.isArray(station.content)) { const ingredient = station.content as Ingredient; if (ingredient.state === IngredientState.COOKED) { if (heldItem && Array.isArray(heldItem)) { setHeldItem([...heldItem, ingredient]); newStations[index] = { ...station, content: null }; return newStations; } const plateIndex = stations.findIndex(s => s.type === 'PLATE'); if (plateIndex !== -1) { const currentPlate = Array.isArray(newStations[plateIndex].content) ? newStations[plateIndex].content as Ingredient[] : []; newStations[plateIndex] = { ...newStations[plateIndex], content: [...currentPlate, ingredient] }; newStations[index] = { ...station, content: null }; if (heldItem && !Array.isArray(heldItem)) { const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0; const isPrepItem = heldItem.id === 'tomato' || heldItem.id === 'onion'; if ((station.type === 'STOVE' && isCookable && !isPrepItem) || (station.type === 'PREP' && isPrepItem)) { newStations[index] = { ...newStations[index], content: { ...heldItem, state: IngredientState.COOKING } }; setHeldItem(null); } } return newStations; } } } if (heldItem && !Array.isArray(heldItem)) { const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0; const isPrepItem = heldItem.id === 'tomato' || heldItem.id === 'onion'; if (station.type === 'STOVE' && !isPrepItem) { if (!station.content && isCookable) { newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } }; setHeldItem(null); } } else if (station.type === 'PREP' && isPrepItem) { if (!station.content) { newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } }; setHeldItem(null); } } else if (station.type === 'PLATE') { const currentPlate = Array.isArray(station.content) ? station.content : []; newStations[index] = { ...station, content: [...currentPlate, heldItem] }; setHeldItem(null); } } else if (!heldItem && station.content) { if (station.type === 'PLATE') { const plateContent = station.content as Ingredient[]; if (plateContent.length > 0) { const matchedCustomer = customers.find(c => { if (!c.order) return false; const recipe = RECIPES[c.order.recipeId]; const heldIds = plateContent.map(i => i.id).sort(); const requiredIds = [...recipe.ingredients].sort(); const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds); const isAllCooked = plateContent.every(ing => { const data = INGREDIENT_DATA[ing.id]; return data.cookTime === 0 || ing.state === IngredientState.COOKED; }); return isIdsMatch && isAllCooked; }); if (matchedCustomer) { const recipe = RECIPES[matchedCustomer.order!.recipeId]; onDishServed(recipe.score); setCustomers(prev => prev.filter(c => c.id !== matchedCustomer.id)); newStations[index] = { ...station, content: [] }; } else { setHeldItem(plateContent); newStations[index] = { ...station, content: [] }; } } } else { setHeldItem(station.content as Ingredient); newStations[index] = { ...station, content: null }; } } else if (heldItem && Array.isArray(heldItem) && station.type === 'PLATE') { const plateContent = heldItem as Ingredient[]; const matchedCustomer = customers.find(c => { if (!c.order) return false; const recipe = RECIPES[c.order.recipeId]; const heldIds = plateContent.map(i => i.id).sort(); const requiredIds = [...recipe.ingredients].sort(); const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds); const isAllCooked = plateContent.every(ing => { const data = INGREDIENT_DATA[ing.id]; return data.cookTime === 0 || ing.state === IngredientState.COOKED; }); return isIdsMatch && isAllCooked; }); if (matchedCustomer) { const recipe = RECIPES[matchedCustomer.order!.recipeId]; onDishServed(recipe.score); setCustomers(prev => prev.filter(c => c.id !== matchedCustomer.id)); setHeldItem(null); } else { const isStationEmpty = !station.content || (Array.isArray(station.content) && station.content.length === 0); if (isStationEmpty) { newStations[index] = { ...station, content: heldItem }; setHeldItem(null); } } } return newStations; }); };
  const serveCustomer = (customerIndex: number) => { if (!heldItem || !Array.isArray(heldItem)) return; const customer = customers.find(c => c.slotIndex === customerIndex); if (!customer || !customer.order) return; const recipe = RECIPES[customer.order.recipeId]; const heldIds = heldItem.map(i => i.id).sort(); const requiredIds = [...recipe.ingredients].sort(); const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds); const isAllCooked = heldItem.every(ing => { const data = INGREDIENT_DATA[ing.id]; return data.cookTime === 0 || ing.state === IngredientState.COOKED; }); if (isIdsMatch && isAllCooked) { onDishServed(recipe.score); setCustomers(prev => prev.filter(c => c.id !== customer.id)); setHeldItem(null); } };
  const trashHeldItem = () => { setHeldItem(null); };

  // --- Render Area ---

  // 1. ✨ 改写后的游戏开始界面 (像素风 + 使用 bgImage)
  if (gameState === 'START') {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center h-screen font-mono select-none overflow-hidden">
        {/* 使用你上传的背景图 */}
        <img 
          src={bgImage} 
          alt="" 
          className="absolute inset-0 w-full h-full object-cover object-top opacity-100 pointer-events-none"
        />
        {/* 添加深色蒙版以提高文字可视度 */}
        <div className="absolute inset-0 bg-black/60 z-0" />

        <motion.div 
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative z-10 text-center p-12 bg-stone-900/80 border-8 border-amber-900 rounded-none
