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
// Vite 图片 Import
// ==========================================
import bgImage from './assets/backgrounds/background.png';
import counterWoodImage from './assets/backgrounds/counter_wood.png';
import plateImage from './assets/backgrounds/plate.png'; 
import stationFryerImage from './assets/machines/station_grill.png'; 
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
          setGameState(coins >= currentLevel.targetScore ? 'LEVEL_COMPLETE' : 'GAMEOVER');
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
            return { ...customer, order: { ...customer.order, remainingTime: newTime }, patience: (newTime / customer.order.totalTime) * 100 };
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
            order: { id: Math.random().toString(36).substr(2, 9), recipeId: randomRecipe.id, remainingTime: currentLevel.orderTime, totalTime: currentLevel.orderTime }
          }];
        }
        return prev;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [gameState, coins, currentLevel]);

  const takeIngredient = (id: IngredientId) => {
    const newIngredient: Ingredient = { id, name: INGREDIENT_DATA[id].name, state: IngredientState.RAW, progress: 0 };
    if (heldItem && Array.isArray(heldItem) && INGREDIENT_DATA[id].cookTime === 0) {
      setHeldItem([...heldItem, newIngredient]);
      return;
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
    if (id === 'tomato' || id === 'onion') {
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
        const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0;
        const isPrepItem = heldItem.id === 'tomato' || heldItem.id === 'onion';
        if (station.type === 'STOVE' && !isPrepItem && !station.content && isCookable) {
          newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
          setHeldItem(null);
        } else if (station.type === 'PREP' && isPrepItem && !station.content) {
          newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
          setHeldItem(null);
        } else if (station.type === 'PLATE') {
          const currentPlate = Array.isArray(station.content) ? station.content : [];
          newStations[index] = { ...station, content: [...currentPlate, heldItem] };
          setHeldItem(null);
        }
      } else if (!heldItem && station.content) {
        setHeldItem(station.content as Ingredient | Ingredient[]);
        newStations[index] = { ...station, content: station.type === 'PLATE' ? [] : null };
      }
      return newStations;
    });
  };

  const serveCustomer = (customerIndex: number) => {
    if (!heldItem || !Array.isArray(heldItem)) return;
    const customer = customers.find(c => c.slotIndex === customerIndex);
    if (!customer?.order) return;
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
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none" />
        
        <header className="h-14 bg-[#8b4f2f]/95 flex items-center justify-between px-2 z-50 relative shadow-sm border-b border-black/20">
          <div className="flex items-center gap-2"><ChefHat className="text-amber-100 w-5 h-5" /><span className="text-amber-50 font-bold text-sm">{currentLevel.name}</span></div>
          <div className="flex items-center gap-1 text-xs font-bold text-amber-50">
            <div className="bg-black/25 px-2 py-1 rounded">⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="bg-black/25 px-2 py-1 rounded">💰 {coins}</div>
          </div>
        </header>

        <main className="h-[calc(100vh-56px)] relative z-0 overflow-hidden">
          {/* Customers */}
          <div className="absolute left-0 right-0 bottom-[50%] h-[220px] flex justify-between px-4 items-end z-10 pointer-events-none">
            {[0, 1, 2].map(slot => {
              const customer = customers.find(c => c.slotIndex === slot);
              return (
                <div key={slot} className="w-[122px] flex flex-col items-center justify-end relative">
                  <AnimatePresence>
                    {customer && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="flex flex-col items-center pointer-events-auto" onClick={() => serveCustomer(slot)}>
                        <div className="absolute bottom-[79%] left-1/2 -translate-x-1/2 z-40 mb-4 order-bubble scale-90">
                           <img src={RECIPES[customer.order!.recipeId].image} className="w-10 h-10 object-contain drop-shadow-lg" />
                        </div>
                        <img src={customer.image} className="w-[190px] h-[190px] object-contain drop-shadow-lg" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="absolute left-0 right-0 bottom-0 z-20 pointer-events-none"><img src={counterWoodImage} className="w-full object-cover" /></div>

          {/* Stations */}
          <div className="absolute left-0 right-0 bottom-[25%] px-2 z-30">
            <div className="grid grid-cols-4 gap-1">
              {stations.map(station => (
                <div key={station.id} onClick={() => interactWithStation(station.id)} className="w-full h-[118px] rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 relative shadow-lg">
                  <img src={station.id.startsWith("fryer") ? stationFryerImage : station.id.startsWith("grill") ? stationGrillImage : station.id.startsWith("prep") ? stationSauceImage : plateImage} className="absolute inset-0 w-full h-full object-contain" />
                  <div className="relative z-10">
                    {station.content && (Array.isArray(station.content) ? (
                      <div className="flex flex-wrap gap-1 justify-center">{station.content.map((ing, i) => <img key={i} src={INGREDIENT_DATA[ing.id].image} className="w-8 h-8 object-contain" />)}</div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <img src={INGREDIENT_DATA[station.content.id].image} className="w-24 h-24 object-contain" />
                        {station.content.state === IngredientState.COOKING && <div className="w-16 h-2 bg-stone-600 rounded-full overflow-hidden mt-1"><div className="h-full bg-orange-500" style={{ width: `${station.content.progress}%` }} /></div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 核心改动：Holding Item UI (居中显示在底部操作栏上方) */}
          <AnimatePresence>
            {heldItem && (
              <motion.div 
                initial={{ y: 20, opacity: 0, scale: 0.8 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: 20, opacity: 0, scale: 0.8 }}
                className="absolute bottom-[10%] left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
              >
                <div className="bg-white/90 border-4 border-emerald-500 rounded-2xl p-3 shadow-2xl flex flex-col items-center min-w-[100px]">
                  <span className="text-[10px] font-black text-emerald-600 uppercase mb-1">HOLDING</span>
                  <div className="w-16 h-16 flex items-center justify-center">
                    {Array.isArray(heldItem) ? (
                      <div className="relative w-full h-full flex items-center justify-center">
                        <img src={plateImage} className="absolute w-full h-full object-contain opacity-40" />
                        <div className="flex flex-wrap gap-1 justify-center scale-75">
                          {heldItem.map((ing, i) => <img key={i} src={INGREDIENT_DATA[ing.id].image} className="w-8 h-8 object-contain" />)}
                        </div>
                      </div>
                    ) : (
                      <img src={INGREDIENT_DATA[heldItem.id].image} className="w-full h-full object-contain drop-shadow-md" />
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Bottom Ingredients */}
          <div className="absolute left-0 right-0 bottom-4 px-2 flex justify-between items-end gap-1 z-50">
            <div className="grid grid-cols-4 gap-1 max-w-[82%]">
              {currentLevel.unlockedIngredients.map(id => (
                <div key={id} onClick={() => takeIngredient(id)} className="w-[64px] h-[74px] bg-white rounded-lg border border-stone-200 shadow-sm flex flex-col items-center justify-center cursor-pointer active:scale-95">
                  <img src={INGREDIENT_DATA[id].image} className="w-12 h-12 object-contain mb-1" />
                  <span className="text-[10px] font-bold text-stone-500 uppercase">{INGREDIENT_DATA[id].name}</span>
                </div>
              ))}
            </div>
            <div onClick={() => setHeldItem(null)} className="w-14 h-14 bg-red-100 border border-red-200 rounded-full flex items-center justify-center cursor-pointer active:scale-90 shadow-md">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
        </main>

        {/* Start Overlay */}
        {gameState === 'START' && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
              <ChefHat className="w-12 h-12 text-emerald-600 mx-auto mb-8" />
              <h2 className="text-4xl font-bold mb-4">Kitchen Master</h2>
              <button onClick={() => setGameState('LEVEL_SELECT')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">SELECT LEVEL</button>
            </motion.div>
          </div>
        )}

        {/* Level Select */}
        {gameState === 'LEVEL_SELECT' && (
          <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[80vh] flex flex-col">
              <h2 className="text-3xl font-bold mb-6 text-center">Select Level</h2>
              <div className="grid grid-cols-4 gap-4 overflow-y-auto p-2">
                {LEVELS.map((level, idx) => (
                  <button key={level.id} onClick={() => startLevel(idx)} className="aspect-square bg-stone-100 border-2 border-stone-200 rounded-2xl font-bold text-2xl">{level.id}</button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
