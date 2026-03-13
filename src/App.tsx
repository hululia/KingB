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
          const newCustomer: Customer = {
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
          };
          return [...prev, newCustomer];
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
    if (!heldItem) setHeldItem(newIngredient);
  };

  const interactWithStation = (stationId: string) => {
    setStations(prev => {
      const station = prev.find(s => s.id === stationId);
      if (!station) return prev;
      const newStations = [...prev];
      const index = prev.findIndex(s => s.id === stationId);

      if (!heldItem && station.content) {
        if (station.type === 'PLATE') {
          setHeldItem(station.content as Ingredient[]);
          newStations[index] = { ...station, content: [] };
        } else {
          setHeldItem(station.content as Ingredient);
          newStations[index] = { ...station, content: null };
        }
      } else if (heldItem && !Array.isArray(heldItem)) {
        if (station.type === 'STOVE' && !station.content && INGREDIENT_DATA[heldItem.id].cookTime > 0) {
          newStations[index] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
          setHeldItem(null);
        } else if (station.type === 'PLATE') {
          const currentPlate = Array.isArray(station.content) ? station.content : [];
          newStations[index] = { ...station, content: [...currentPlate, heldItem] };
          setHeldItem(null);
        }
      }
      return newStations;
    });
  };

  const serveCustomer = (slot: number) => {
    if (!heldItem || !Array.isArray(heldItem)) return;
    const customer = customers.find(c => c.slotIndex === slot);
    if (!customer || !customer.order) return;
    const recipe = RECIPES[customer.order.recipeId];
    const heldIds = heldItem.map(i => i.id).sort();
    const reqIds = [...recipe.ingredients].sort();
    if (JSON.stringify(heldIds) === JSON.stringify(reqIds)) {
      setCoins(prev => prev + recipe.score);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setHeldItem(null);
    }
  };

  return (
    <div className="h-full w-full flex items-center justify-center font-sans overflow-hidden bg-stone-200 relative">
      <div className="relative w-full max-w-[430px] h-full bg-transparent overflow-hidden">
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover object-top opacity-100 pointer-events-none" />

        <header className="h-14 bg-[#8b4f2f]/95 border-b border-[#5d2f1b] flex items-center justify-between px-2 shadow-sm z-50 relative">
          <div className="flex items-center gap-2">
            <ChefHat className="text-amber-100 w-5 h-5" />
            <span className="text-amber-50 font-bold text-sm truncate">{currentLevel.name}</span>
          </div>
          <div className="flex items-center gap-1 text-amber-50 font-bold text-xs">
            <div className="bg-black/25 px-2 py-1 rounded">⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="bg-black/25 px-2 py-1 rounded">💰 {coins}</div>
          </div>
        </header>

        {/* ✅ Main Game Area (绝对定位舞台) */}
        <main className="h-[calc(100vh-56px)] relative z-0">

          {/* ✅ Bubbles layer (bottom = 75%) */}
          {[0, 1, 2].map(slot => {
            const customer = customers.find(c => c.slotIndex === slot);
            return (
              <div key={`bubble-${slot}`} className="absolute w-[120px] z-40" style={{ bottom: '75%', left: `${slot * 33.3 + 16.6}%`, transform: 'translateX(-50%)' }}>
                <AnimatePresence>
                  {customer?.order && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="order-bubble bg-white/90 p-2 rounded-2xl shadow-xl border-2 border-white flex flex-col items-center gap-1">
                      <img 
                        src={RECIPES[customer.order.recipeId].image} 
                        className="w-10 h-10 object-contain drop-shadow-sm" 
                        onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} 
                      />
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${customer.patience > 50 ? 'bg-emerald-500' : customer.patience > 25 ? 'bg-amber-500' : 'bg-red-500'}`} 
                          animate={{ width: `${customer.patience}%` }} 
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* ✅ Customers layer (bottom = 50%) */}
          {[0, 1, 2].map(slot => {
            const customer = customers.find(c => c.slotIndex === slot);
            return (
              <div key={`cust-${slot}`} className="absolute w-[180px] z-10 flex justify-center" style={{ bottom: '50%', left: `${slot * 33.3 + 16.6}%`, transform: 'translateX(-50%)' }}>
                <AnimatePresence>
                  {customer && (
                    <motion.div 
                      initial={{ y: 50, opacity: 0 }} 
                      animate={{ y: 0, opacity: 1 }} 
                      className="cursor-pointer" 
                      onClick={() => serveCustomer(slot)}
                    >
                      <img src={customer.image} className="w-full h-auto drop-shadow-2xl" onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {/* ✅ Table layer (bottom = 40%) */}
          <div className="absolute left-0 right-0 z-20 flex justify-center pointer-events-none" style={{ bottom: '40%' }}>
            <img 
              src={counterWoodImage} 
              className="w-full h-[120px] object-cover scale-[1.6] origin-bottom drop-shadow-lg" 
              onError={(e)=>(e.currentTarget.style.display='none')} 
            />
          </div>

          {/* ✅ Stations layer (bottom = 25%) */}
          <div className="absolute left-2 right-2 grid grid-cols-4 gap-1 z-30" style={{ bottom: '25%' }}>
            {stations.map(station => (
              <div 
                key={station.id} 
                onClick={() => interactWithStation(station.id)}
                className="w-full h-[110px] bg-white/10 rounded-xl border-2 border-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer shadow-lg hover:bg-white/20 transition-all"
              >
                {station.content ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={Array.isArray(station.content) ? plateImage : INGREDIENT_DATA[(station.content as Ingredient).id].image} 
                      className="w-14 h-14 object-contain drop-shadow-md" 
                      onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} 
                    />
                    {!Array.isArray(station.content) && (station.content as Ingredient).state === IngredientState.COOKING && (
                      <div className="w-12 h-1.5 bg-black/40 rounded-full mt-1 overflow-hidden">
                        <div className="h-full bg-orange-500" style={{ width: `${(station.content as Ingredient).progress}%` }} />
                      </div>
                    )}
                  </div>
                ) : (
                  <img 
                    src={station.id.includes('fryer') ? stationFryerImage : station.id.includes('grill') ? stationGrillImage : stationSauceImage} 
                    className="w-12 h-12 opacity-80" 
                    onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} 
                  />
                )}
              </div>
            ))}
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-4 left-2 right-2 flex justify-between items-end z-50">
            <div className="grid grid-cols-4 gap-1 flex-1">
              {currentLevel.unlockedIngredients.map(id => (
                <div key={id} onClick={() => takeIngredient(id)} className="bg-white/95 p-2 rounded-lg shadow-md flex flex-col items-center cursor-pointer active:scale-90 transition-transform border border-stone-200">
                  <img src={INGREDIENT_DATA[id].image} className="w-10 h-10 object-contain" />
                  <span className="text-[9px] font-bold text-stone-500 uppercase mt-1">{INGREDIENT_DATA[id].name}</span>
                </div>
              ))}
            </div>
            <div onClick={() => setHeldItem(null)} className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center ml-2 cursor-pointer shadow-lg border-2 border-red-200 active:scale-90">
              <XCircle className="text-red-500 w-8 h-8" />
            </div>
          </div>
        </main>
      </div>

      {/* Overlays (不改动风格) */}
      {gameState === 'START' && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
          <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-white rounded-3xl p-12 max-w-md shadow-2xl">
            <ChefHat className="w-16 h-16 text-emerald-600 mx-auto mb-4" />
            <h2 className="text-4xl font-bold mb-4">Kitchen Master</h2>
            <button onClick={() => setGameState('LEVEL_SELECT')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">START COOKING</button>
          </motion.div>
        </div>
      )}

      {gameState === 'LEVEL_SELECT' && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full grid grid-cols-4 gap-3 overflow-y-auto max-h-[70vh]">
            {LEVELS.map((level, idx) => (
              <button key={level.id} onClick={() => startLevel(idx)} className="aspect-square bg-stone-100 rounded-xl font-bold text-xl hover:bg-emerald-100 border-2 border-stone-200">
                {level.id}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 结算与失败界面保持原有逻辑... */}
      { (gameState === 'LEVEL_COMPLETE' || gameState === 'GAMEOVER') && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
           <div className="bg-white p-10 rounded-3xl shadow-2xl max-w-sm w-full">
              <h2 className="text-3xl font-bold mb-4">{gameState === 'LEVEL_COMPLETE' ? 'Success!' : 'Failed!'}</h2>
              <div className="text-5xl font-bold text-emerald-600 mb-8">💰 {coins}</div>
              <button onClick={() => setGameState('LEVEL_SELECT')} className="w-full bg-stone-900 text-white py-4 rounded-xl font-bold">BACK TO MENU</button>
           </div>
        </div>
      )}
    </div>
  );
}
