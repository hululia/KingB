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

import bgImage from './assets/backgrounds/background.png';
import counterWoodImage from './assets/backgrounds/counter_wood.png';
import plateImage from './assets/backgrounds/plate.png'; 
import stationFryerImage from './assets/machines/station_fryer.png';
import stationGrillImage from './assets/machines/station_grill.png';
import stationSauceImage from './assets/machines/station_sauce.png';

const MAX_CUSTOMERS = 3;

export default function App() {
  const [gameState, setGameState] = useState<'START' | 'LEVEL_SELECT' | 'PLAYING' | 'PAUSED' | 'GAMEOVER' | 'LEVEL_COMPLETE'>('START');
  const [currentLevelIdx, setCurrentLevelIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [coins, setCoins] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stations, setStations] = useState<Station[]>([
    { id: 'grill-1', type: 'STOVE', content: null, isCooking: false },
    { id: 'fryer-1', type: 'STOVE', content: null, isCooking: false },
    { id: 'prep-1', type: 'PREP', content: null, isCooking: false },
    { id: 'plate-1', type: 'PLATE', content: [], isCooking: false },
  ]);
  const [heldItem, setHeldItem] = useState<Ingredient | Ingredient[] | null>(null);

  const currentLevel = LEVELS[currentLevelIdx];

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

  useEffect(() => {
    if (gameState !== 'PLAYING') return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (coins >= currentLevel.targetScore) setGameState('LEVEL_COMPLETE');
          else setGameState('GAMEOVER');
          return 0;
        }
        return prev - 1;
      });

      setStations(prev => prev.map(station => {
        if ((station.type === 'STOVE' || station.type === 'PREP') && station.content && !Array.isArray(station.content)) {
          const ingredient = station.content as Ingredient;
          if (ingredient.state === IngredientState.COOKING) {
            const cookTime = INGREDIENT_DATA[ingredient.id].cookTime;
            const newProgress = ingredient.progress + (100 / (cookTime * 10));
            if (newProgress >= 100) {
              return { ...station, content: { ...ingredient, state: IngredientState.COOKED, progress: 100 } };
            }
            return { ...station, content: { ...ingredient, progress: newProgress } };
          }
        }
        return station;
      }));

      setCustomers(prev => {
        const updated = prev.map(customer => {
          if (customer.order) {
            const newTime = customer.order.remainingTime - 0.1;
            if (newTime <= 0) return { ...customer, order: null, patience: 0 };
            return {
              ...customer,
              order: { ...customer.order, remainingTime: newTime },
              patience: (newTime / customer.order.totalTime) * 100
            };
          }
          return customer;
        });
        return updated.filter(c => c.order !== null || Math.random() > 0.99);
      });

      setCustomers(prev => {
        if (prev.length < MAX_CUSTOMERS && Math.random() < currentLevel.customerSpawnRate) {
          const recipeIds = currentLevel.availableRecipes;
          const randomRecipe = RECIPES[recipeIds[Math.floor(Math.random() * recipeIds.length)]];
          const typeIndex = Math.floor(Math.random() * CUSTOMER_IMAGES.length);
          return [...prev, {
            id: Math.random().toString(36).substr(2, 9),
            slotIndex: [0, 1, 2].find(i => !prev.some(c => c.slotIndex === i)) ?? 0,
            patience: 100,
            image: CUSTOMER_IMAGES[typeIndex],
            color: CUSTOMER_COLORS[typeIndex],
            order: {
              id: Math.random().toString(36).substr(2, 9),
              recipeId: randomRecipe.id,
              remainingTime: currentLevel.orderTime,
              totalTime: currentLevel.orderTime
            }
          }];
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, coins, currentLevel]);

  const takeIngredient = (id: IngredientId) => {
    const newIngredient: Ingredient = { id, name: INGREDIENT_DATA[id].name, state: IngredientState.RAW, progress: 0 };
    if (heldItem && Array.isArray(heldItem)) {
      if (INGREDIENT_DATA[id].cookTime === 0) {
        setHeldItem([...heldItem, newIngredient]);
        return;
      }
    }
    if (['bread', 'cheese', 'lettuce', 'pickles'].includes(id)) {
      const plateIndex = stations.findIndex(s => s.type === 'PLATE');
      if (plateIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          const currentPlate = Array.isArray(updated[plateIndex].content) ? updated[plateIndex].content as Ingredient[] : [];
          updated[plateIndex] = { ...updated[plateIndex], content: [...currentPlate, newIngredient] };
          return updated;
        });
        return;
      }
    }
    if (['tomato', 'onion'].includes(id)) {
      const emptyPrepIndex = stations.findIndex(s => s.type === 'PREP' && !s.content);
      if (emptyPrepIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          updated[emptyPrepIndex] = { ...updated[emptyPrepIndex], content: { ...newIngredient, state: IngredientState.COOKING } };
          return updated;
        });
        return;
      }
    }
    if (INGREDIENT_DATA[id].cookTime > 0 && id !== 'tomato' && id !== 'onion') {
      const emptyStoveIndex = stations.findIndex(s => s.type === 'STOVE' && !s.content);
      if (emptyStoveIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          updated[emptyStoveIndex] = { ...updated[emptyStoveIndex], content: { ...newIngredient, state: IngredientState.COOKING } };
          return updated;
        });
        return;
      }
    }
    if (!heldItem) setHeldItem(newIngredient);
  };

  const interactWithStation = (stationId: string) => {
    setStations(prev => {
      const station = prev.find(s => s.id === stationId);
      if (!station) return prev;
      const newStations = [...prev];
      const index = prev.findIndex(s => s.id === stationId);

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
            const currentPlate = Array.isArray(newStations[plateIndex].content) ? newStations[plateIndex].content as Ingredient[] : [];
            newStations[plateIndex] = { ...newStations[plateIndex], content: [...currentPlate, ingredient] };
            newStations[index] = { ...station, content: null };
            return newStations;
          }
        }
      }

      if (heldItem && !Array.isArray(heldItem)) {
        if (station.type === 'STOVE' && !['tomato', 'onion'].includes(heldItem.id) && !station.content && INGREDIENT_DATA[heldItem.id].cookTime > 0) {
          newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
          setHeldItem(null);
        } else if (station.type === 'PREP' && ['tomato', 'onion'].includes(heldItem.id) && !station.content) {
          newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
          setHeldItem(null);
        } else if (station.type === 'PLATE') {
          const currentPlate = Array.isArray(station.content) ? station.content : [];
          newStations[index] = { ...station, content: [...currentPlate, heldItem] };
          setHeldItem(null);
        }
      } else if (!heldItem && station.content) {
        if (station.type === 'PLATE') {
          const plateContent = station.content as Ingredient[];
          if (plateContent.length > 0) {
            setHeldItem(plateContent);
            newStations[index] = { ...station, content: [] };
          }
        } else {
          setHeldItem(station.content as Ingredient);
          newStations[index] = { ...station, content: null };
        }
      }
      return newStations;
    });
  };

  const serveCustomer = (slotIndex: number) => {
    if (!heldItem || !Array.isArray(heldItem)) return;
    const customer = customers.find(c => c.slotIndex === slotIndex);
    if (!customer || !customer.order) return;
    const recipe = RECIPES[customer.order.recipeId];
    const heldIds = heldItem.map(i => i.id).sort();
    const requiredIds = [...recipe.ingredients].sort();
    if (JSON.stringify(heldIds) === JSON.stringify(requiredIds)) {
      setCoins(prev => prev + recipe.score);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setHeldItem(null);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center font-sans overflow-hidden bg-stone-200 relative">
      <div className="relative w-full max-w-[430px] h-full bg-transparent overflow-hidden">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-top z-0" />

        <header className="h-14 bg-[#8b4f2f]/95 border-b border-[#5d2f1b] flex items-center justify-between px-2 shadow-sm z-50 relative">
          <div className="flex items-center gap-2 min-w-0 text-amber-50">
            <ChefHat className="w-5 h-5" />
            <span className="font-bold text-sm truncate">{currentLevel.name}</span>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-50">
            <div className="bg-black/25 px-2 py-1 rounded">⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="bg-black/25 px-2 py-1 rounded">💰 {coins}</div>
            <div className="bg-black/25 px-2 py-1 rounded">🎯 {currentLevel.targetScore}</div>
          </div>
        </header>

        {/* --- MAIN AREA --- */}
        <main className="relative h-[calc(100vh-56px)] w-full z-10">
          
          {/* 1. Bubble Area (z-40) - bottom: 75% */}
          <div className="absolute bottom-[75%] left-0 right-0 z-40 flex justify-between px-6 pointer-events-none">
            {[0, 1, 2].map(slot => {
              const customer = customers.find(c => c.slotIndex === slot);
              return (
                <div key={slot} className="w-24 flex flex-col items-center">
                  <AnimatePresence>
                    {customer && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                        <div className="bg-white/90 p-2 rounded-2xl shadow-xl border-2 border-white flex flex-col items-center gap-1">
                          <img src={RECIPES[customer.order!.recipeId].image} className="w-10 h-10 object-contain" alt="" />
                          <div className="w-12 h-1 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${customer.patience}%` }} />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 2. Customer Area (z-10) - bottom: 50% */}
          <div className="absolute bottom-[50%] left-0 right-0 z-10 flex justify-between px-4">
            {[0, 1, 2].map(slot => {
              const customer = customers.find(c => c.slotIndex === slot);
              return (
                <div key={slot} className="w-28 h-40 flex items-end justify-center cursor-pointer pointer-events-auto" onClick={() => serveCustomer(slot)}>
                   <AnimatePresence>
                    {customer && (
                      <motion.img 
                        initial={{ y: 100 }} animate={{ y: 0 }} exit={{ y: 100 }}
                        src={customer.image} className="w-full h-full object-contain drop-shadow-md" 
                      />
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 3. Table Area (z-20) - bottom: 40% - 显示全面修正 */}
          <div className="absolute bottom-[40%] left-0 right-0 z-20 pointer-events-none flex justify-center">
            <img 
              src={counterWoodImage} 
              className="w-full h-auto object-contain scale-[1.1]" 
              alt="table" 
            />
          </div>

          {/* 4. Stations Layer (z-30) - bottom: 25% */}
          <div className="absolute bottom-[25%] left-0 right-0 z-30 px-4">
            <div className="grid grid-cols-4 gap-2">
              {stations.map(station => (
                <div 
                  key={station.id} onClick={() => interactWithStation(station.id)}
                  className="aspect-square bg-white/10 backdrop-blur-sm rounded-xl border-b-4 border-black/20 flex flex-col items-center justify-center cursor-pointer active:scale-95 transition-transform"
                >
                  {station.content && (!Array.isArray(station.content) || station.content.length > 0) ? (
                    <img 
                      src={Array.isArray(station.content) ? plateImage : INGREDIENT_DATA[(station.content as Ingredient).id].image} 
                      className="w-12 h-12 object-contain" alt="" 
                    />
                  ) : (
                    <img 
                      src={station.id.startsWith("grill") ? stationGrillImage : station.id.startsWith("fryer") ? stationFryerImage : plateImage} 
                      className="w-10 h-10 object-contain opacity-60" alt="" 
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 5. Ingredients Shelf (Bottom) */}
          <div className="absolute bottom-4 left-0 right-0 px-4 z-50 flex items-end justify-between">
            <div className="grid grid-cols-4 gap-2 flex-1">
              {currentLevel.unlockedIngredients.map(id => (
                <div key={id} onClick={() => takeIngredient(id)} className="bg-white/90 p-2 rounded-lg shadow-sm flex flex-col items-center cursor-pointer active:scale-90">
                  <img src={INGREDIENT_DATA[id].image} className="w-10 h-10 object-contain" alt="" />
                  <span className="text-[8px] font-bold text-stone-500">{INGREDIENT_DATA[id].name}</span>
                </div>
              ))}
            </div>
            <div onClick={() => setHeldItem(null)} className="ml-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center cursor-pointer">
              <XCircle className="text-red-500" />
            </div>
          </div>
        </main>

        {/* ... Rest of the overlays (START, LEVEL_SELECT, etc.) remain unchanged ... */}
      </div>
    </div>
  );
}
