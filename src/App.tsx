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
// Vite 图片 Import 区域
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
    if (heldItem && Array.isArray(heldItem)) { if (INGREDIENT_DATA[id].cookTime === 0) { setHeldItem([...heldItem, newIngredient]); return; } }
    if (id === 'bread' || id === 'cheese' || id === 'lettuce' || id === 'pickles') {
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

  const onDishServed = (score: number) => {
    setCoins(prev => prev + score);
    if (currentLevel.id === 21) setTimeLeft(prev => prev + 5);
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
        if (station.type === 'PLATE') {
          const currentPlate = Array.isArray(station.content) ? station.content : [];
          newStations[index] = { ...station, content: [...currentPlate, heldItem] };
          setHeldItem(null);
        }
      } else if (!heldItem && station.content) {
        if (station.type === 'PLATE') {
          const plateContent = station.content as Ingredient[];
          if (plateContent.length > 0) {
            const matchedCustomer = customers.find(c => {
              if (!c.order) return false;
              const recipe = RECIPES[c.order.recipeId];
              const heldIds = plateContent.map(i => i.id).sort();
              const requiredIds = [...recipe.ingredients].sort();
              return JSON.stringify(heldIds) === JSON.stringify(requiredIds) && plateContent.every(ing => INGREDIENT_DATA[ing.id].cookTime === 0 || ing.state === IngredientState.COOKED);
            });
            if (matchedCustomer) {
              onDishServed(RECIPES[matchedCustomer.order!.recipeId].score);
              setCustomers(prev => prev.filter(c => c.id !== matchedCustomer.id));
              newStations[index] = { ...station, content: [] };
            } else {
              setHeldItem(plateContent);
              newStations[index] = { ...station, content: [] };
            }
          }
        } else {
          setHeldItem(station.content as Ingredient);
          newStations[index] = { ...station, content: null };
        }
      }
      return newStations;
    });
  };

  const serveCustomer = (customerIndex: number) => {
    if (!heldItem || !Array.isArray(heldItem)) return;
    const customer = customers.find(c => c.slotIndex === customerIndex);
    if (!customer || !customer.order) return;
    const recipe = RECIPES[customer.order.recipeId];
    const heldIds = heldItem.map(i => i.id).sort();
    const requiredIds = [...recipe.ingredients].sort();
    if (JSON.stringify(heldIds) === JSON.stringify(requiredIds) && heldItem.every(ing => INGREDIENT_DATA[ing.id].cookTime === 0 || ing.state === IngredientState.COOKED)) {
      onDishServed(recipe.score);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setHeldItem(null);
    }
  };

  const trashHeldItem = () => setHeldItem(null);

  return (
    <div className="h-full w-full flex items-center justify-center font-sans overflow-hidden bg-stone-200 relative">
      <div className="relative w-full max-w-[430px] h-full bg-transparent overflow-hidden">
        <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover object-top opacity-100 pointer-events-none" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} />
        
        <header className="h-14 bg-[#8b4f2f]/95 border-b border-[#5d2f1b] flex items-center justify-between px-2 shadow-sm z-50 relative">
          <div className="flex items-center gap-2 min-w-0"> <ChefHat className="text-amber-100 w-5 h-5" /> <span className="text-amber-50 font-bold text-sm truncate">{currentLevel.name}</span> </div>
          <div className="flex items-center gap-1">
            <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">💰 {coins}</div>
            <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">🎯 {currentLevel.id === 21 ? '∞' : currentLevel.targetScore}</div>
          </div>
        </header>

        <main className="h-[calc(100vh-56px)] relative px-2 pt-2 pb-3 flex flex-col gap-2 z-0">
          <div className="h-[30%] min-h-[220px] flex justify-between px-2 items-end">
            {[0, 1, 2].map(slot => {
              const customer = customers.find(c => c.slotIndex === slot);
              return (
                <div key={slot} className="w-[122px] flex flex-col items-center justify-end relative">
                  <AnimatePresence>
                    {customer && (
                      <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="flex flex-col items-center gap-2 cursor-pointer" onClick={() => serveCustomer(slot)}>
                        <div className="order-bubble mb-2 translate-y-[90%] scale-95">
                          <div className="flex flex-col items-center gap-1">
                            <div className="relative w-12 h-12 flex items-center justify-center"> <img src={RECIPES[customer.order!.recipeId].image} alt="" className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} /> </div>
                            <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden"> <motion.div className={`h-full ${customer.patience > 50 ? 'bg-emerald-500' : customer.patience > 25 ? 'bg-amber-500' : 'bg-red-500'}`} animate={{ width: `${customer.patience}%` }} /> </div>
                          </div>
                        </div>
                        <div className="w-[210px] h-[210px] relative flex items-end justify-center overflow-visible translate-y-[120%]"> <img src={customer.image} alt="Customer" className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]" referrerPolicy="no-referrer" onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }} /> </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          <div className="absolute left-0 right-0 bottom-[22%] z-20 flex justify-center pointer-events-none translate-y-[100%]">
            <img src={counterWoodImage} alt="table" className="w-full h-[120px] object-cover opacity-100 scale-[1.6] origin-bottom" referrerPolicy="no-referrer" onError={(e)=>(e.currentTarget.style.display='none')} />
          </div>

          <div className="h-[70%] bg-transparent rounded-3xl border-0 shadow-none px-1 py-1 flex flex-col gap-2">
            
            {/* ✨ 修改后的 Stations 渲染区域 ✨ */}
            <div className="grid grid-cols-4 gap-1 px-0.5 mt-1 translate-y-[80%] relative z-30">
              {stations.map((station) => {
                // 1. 预计算：如果是正在烹饪的肉类，则应用 60% 缩放
                const isMeatCooking = !Array.isArray(station.content) && 
                                     station.content?.id === 'meat' && 
                                     station.content?.state === IngredientState.COOKING;
                
                // 2. 预计算：根据站台类型选择底图
                let baseImg = plateImage;
                if (station.id.startsWith("grill")) baseImg = stationGrillImage;
                else if (station.id.startsWith("fryer")) baseImg = stationFryerImage;
                else if (station.type === 'PREP') baseImg = stationSauceImage;

                return (
                  <div 
                    key={station.id} 
                    onClick={() => interactWithStation(station.id)} 
                    className="w-full h-[118px] flex flex-col items-center justify-center cursor-pointer transition-all relative group"
                  >
                    {/* 背景层：底图永远显示 */}
                    <img 
                      src={baseImg} 
                      className="absolute inset-0 w-full h-full object-contain opacity-100 drop-shadow-md" 
                      alt="base" 
                    />

                    {/* 标签 */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-400 rounded text-[10px] font-bold text-white uppercase tracking-wider z-20">
                      {station.id.startsWith("grill") ? "GRILL" : station.id.startsWith("fryer") ? "FRYER" : station.id.startsWith("prep") ? "PREP" : "PLATE"}
                    </div>

                    {/* 内容层：叠在底图上方 */}
                    <div className={`relative z-10 transition-transform ${isMeatCooking ? 'scale-[0.6]' : 'scale-90'}`}>
                      {station.content && (
                        Array.isArray(station.content) ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {station.content.slice(0, 4).map((ing, i) => (
                              <img key={i} src={INGREDIENT_DATA[ing.id].image} className="w-8 h-8 object-contain" alt="ing" />
                            ))}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <img src={INGREDIENT_DATA[station.content.id].image} className="w-20 h-20 object-contain drop-shadow-lg" alt="ing" />
                            {station.content.state === IngredientState.COOKING && (
                              <div className="absolute -bottom-2 w-14 h-1.5 bg-black/40 rounded-full overflow-hidden">
                                <div className="h-full bg-orange-500" style={{ width: `${station.content.progress}%` }} />
                              </div>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Counter: Ingredients & Trash */}
            <div className="mt-auto flex justify-between items-end gap-1 relative z-50">
              <div className="grid grid-cols-4 gap-1 max-w-[82%]">
                {currentLevel.unlockedIngredients.map(id => (
                  <div key={id} onClick={() => takeIngredient(id)} className="w-[64px] h-[74px] bg-white/92 rounded-lg border border-stone-200 shadow-sm flex flex-col items-center justify-center cursor-pointer">
                    <img src={INGREDIENT_DATA[id].image} alt="" className="w-12 h-12 object-contain" />
                    <span className="text-[10px] font-bold text-stone-500 uppercase">{INGREDIENT_DATA[id].name}</span>
                  </div>
                ))}
              </div>
              <div onClick={trashHeldItem} className="w-14 h-14 bg-red-100 border border-red-200 rounded-full flex items-center justify-center cursor-pointer">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Overlays (START, LEVEL_SELECT, etc.) */}
      {gameState === 'START' && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl">
            <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8"> <ChefHat className="w-12 h-12 text-emerald-600" /> </div>
            <h2 className="text-4xl font-bold mb-4">Kitchen Master</h2>
            <button onClick={() => setGameState('LEVEL_SELECT')} className="w-full bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg">SELECT LEVEL</button>
          </motion.div>
        </div>
      )}

      {/* 其他状态渲染保留... */}
      {gameState === 'LEVEL_SELECT' && (
        <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-6 text-center">
           <div className="bg-white rounded-3xl p-8 max-w-4xl w-full">
              <h2 className="text-3xl font-bold mb-6">Select Level</h2>
              <div className="grid grid-cols-5 gap-4">
                 {LEVELS.map((l, i) => (
                   <button key={l.id} onClick={() => startLevel(i)} className="p-4 bg-stone-100 rounded-xl font-bold">{l.id}</button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
