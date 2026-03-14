/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle,
  ChefHat,
  Trophy,
  ArrowRight,
  Play,
  RotateCcw
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
// 图片资源 Import
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
    setCurrentLevelIdx(idx);
    setGameState('PLAYING');
    setTimeLeft(LEVELS[idx].duration);
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

  // 游戏主循环 (处理烹饪进度和顾客)
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
        const updated = prev.map(c => {
          if (!c.order) return c;
          const newTime = c.order.remainingTime - 0.1;
          return { ...c, order: newTime <= 0 ? null : { ...c.order, remainingTime: newTime }, patience: (newTime / c.order.totalTime) * 100 };
        }).filter(c => c.order !== null);
        
        if (updated.length < MAX_CUSTOMERS && Math.random() < currentLevel.customerSpawnRate) {
          const recipeId = currentLevel.availableRecipes[Math.floor(Math.random() * currentLevel.availableRecipes.length)];
          const typeIdx = Math.floor(Math.random() * CUSTOMER_IMAGES.length);
          updated.push({
            id: Math.random().toString(36).substr(2, 9),
            slotIndex: [0, 1, 2].find(i => !updated.some(c => c.slotIndex === i)) ?? 0,
            patience: 100,
            image: CUSTOMER_IMAGES[typeIdx],
            color: CUSTOMER_COLORS[typeIdx],
            order: { id: Math.random().toString(36).substr(2, 9), recipeId, remainingTime: currentLevel.orderTime, totalTime: currentLevel.orderTime }
          });
        }
        return updated;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [gameState, coins, currentLevel]);

  // 交互逻辑
  const takeIngredient = (id: IngredientId) => {
    const newIng: Ingredient = { id, name: INGREDIENT_DATA[id].name, state: IngredientState.RAW, progress: 0 };
    
    // 如果手里拿着盘子，且点的是不需要烹饪的食材（如生菜），直接进盘子
    if (heldItem && Array.isArray(heldItem) && INGREDIENT_DATA[id].cookTime === 0) {
      setHeldItem([...heldItem, newIng]);
      return;
    }
    
    // 如果手是空的，拿起来
    if (!heldItem) setHeldItem(newIng);
  };

  const interactWithStation = (stationId: string) => {
    setStations(prev => {
      const idx = prev.findIndex(s => s.id === stationId);
      const station = prev[idx];
      const newStations = [...prev];

      // 1. 如果手里有东西
      if (heldItem) {
        if (!Array.isArray(heldItem)) {
          // 放到 Stove 或 Prep
          const isCookable = INGREDIENT_DATA[heldItem.id].cookTime > 0;
          if ((station.type === 'STOVE' || station.type === 'PREP') && !station.content && isCookable) {
            newStations[idx] = { ...station, content: { ...heldItem, state: IngredientState.COOKING } };
            setHeldItem(null);
          } 
          // 放到 Plate
          else if (station.type === 'PLATE') {
            const currentContent = Array.isArray(station.content) ? station.content : [];
            newStations[idx] = { ...station, content: [...currentContent, heldItem] };
            setHeldItem(null);
          }
        } else if (station.type === 'PLATE' && (!station.content || (station.content as Ingredient[]).length === 0)) {
          // 放回盘子
          newStations[idx] = { ...station, content: heldItem };
          setHeldItem(null);
        }
      } 
      // 2. 如果手是空的，拿起 Station 上的东西
      else if (station.content) {
        setHeldItem(station.content);
        newStations[idx] = { ...station, content: station.type === 'PLATE' ? [] : null };
      }
      return newStations;
    });
  };

  const serveCustomer = (slot: number) => {
    if (!heldItem || !Array.isArray(heldItem)) return;
    const customer = customers.find(c => c.slotIndex === slot);
    if (!customer?.order) return;

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
    <div className="h-full w-full flex items-center justify-center bg-stone-200">
      <div className="relative w-full max-w-[430px] h-screen bg-stone-100 overflow-hidden shadow-2xl">
        
        {/* 背景图 */}
        <img src={bgImage} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

        {/* 顶部栏 */}
        <header className="h-14 bg-[#8b4f2f] flex items-center justify-between px-4 z-50 relative border-b-2 border-black/20">
          <div className="flex items-center gap-2 text-white font-bold"><ChefHat size={20}/> {currentLevel.name}</div>
          <div className="flex gap-2 text-xs font-bold text-amber-50">
            <div className="bg-black/30 px-2 py-1 rounded">⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
            <div className="bg-black/30 px-2 py-1 rounded">💰 {coins} / {currentLevel.targetScore}</div>
          </div>
        </header>

        <main className="h-[calc(100vh-56px)] relative z-0">
          
          {/* 顾客区 */}
          <div className="absolute inset-x-0 bottom-[58%] h-[180px] flex justify-around px-4 items-end z-10">
            {[0, 1, 2].map(slot => {
              const c = customers.find(cust => cust.slotIndex === slot);
              return (
                <div key={slot} className="w-24 relative flex flex-col items-center">
                  <AnimatePresence>
                    {c && (
                      <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} onClick={() => serveCustomer(slot)}>
                        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white p-1 rounded-lg border-2 border-stone-200 shadow-lg">
                          <img src={RECIPES[c.order!.recipeId].image} className="w-8 h-8 object-contain"/>
                        </div>
                        <img src={c.image} className="w-20 h-20 object-contain"/>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {/* 桌子 */}
          <div className="absolute inset-x-0 bottom-0 z-20"><img src={counterWoodImage} className="w-full object-cover"/></div>

          {/* 厨具区 (Station) */}
          <div className="absolute inset-x-0 bottom-[32%] px-6 z-30">
            <div className="grid grid-cols-4 gap-4">
              {stations.map(s => (
                <div key={s.id} onClick={() => interactWithStation(s.id)} className="relative aspect-square flex items-center justify-center">
                  <img src={s.id.includes('grill') ? stationGrillImage : s.id.includes('fryer') ? stationFryerImage : s.id.includes('prep') ? stationSauceImage : plateImage} className="absolute inset-0 w-full h-full object-contain" />
                  <div className="relative z-10 scale-90">
                    {s.content && (Array.isArray(s.content) ? (
                      <div className="flex flex-wrap gap-0.5 justify-center">
                        {s.content.map((ing, i) => <img key={i} src={INGREDIENT_DATA[ing.id].image} className="w-5 h-5 object-contain" />)}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <img src={INGREDIENT_DATA[s.content.id].image} className="w-12 h-12 object-contain" />
                        {s.content.state === IngredientState.COOKING && <div className="w-10 h-1 bg-black/40 rounded-full mt-1 overflow-hidden"><div className="h-full bg-orange-500" style={{width:`${s.content.progress}%`}}/></div>}
                        {s.content.state === IngredientState.COOKED && <CheckCircle2 size={14} className="text-emerald-500 mt-1"/>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 重要修复：手持物品显示图标 (画面底部约 10% 位置) */}
          <AnimatePresence>
            {heldItem && (
              <motion.div 
                initial={{ y: 50, opacity: 0, scale: 0.5 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: 50, opacity: 0, scale: 0.5 }}
                className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[60] pointer-events-none"
              >
                <div className="bg-white/90 border-4 border-emerald-500 rounded-2xl p-3 shadow-2xl flex flex-col items-center min-w-[80px]">
                  <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 tracking-tighter">Holding</span>
                  <div className="w-16 h-16 flex items-center justify-center relative">
                    {Array.isArray(heldItem) ? (
                      <>
                        <img src={plateImage} className="absolute inset-0 w-full h-full object-contain opacity-50" />
                        <div className="flex flex-wrap gap-1 justify-center relative z-10">
                          {heldItem.slice(-4).map((ing, i) => <img key={i} src={INGREDIENT_DATA[ing.id].image} className="w-6 h-6 object-contain" />)}
                        </div>
                      </>
                    ) : (
                      <img src={INGREDIENT_DATA[heldItem.id].image} className="w-full h-full object-contain" />
                    )}
                  </div>
                </div>
                {/* 底部装饰小箭头 */}
                <div className="w-0 h-0 border-x-[10px] border-x-transparent border-t-[10px] border-t-emerald-500 mx-auto" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* 底部食材箱 & 垃圾桶 */}
          <div className="absolute inset-x-0 bottom-6 px-4 flex justify-between items-center z-50">
            <div className="flex gap-2 overflow-x-auto max-w-[80%] pb-2 no-scrollbar">
              {currentLevel.unlockedIngredients.map(id => (
                <div key={id} onClick={() => takeIngredient(id)} className="w-16 h-20 bg-white border-2 border-stone-200 rounded-xl flex flex-col items-center justify-center shadow-sm shrink-0 active:scale-95 transition-transform">
                  <img src={INGREDIENT_DATA[id].image} className="w-10 h-10 object-contain mb-1" />
                  <span className="text-[8px] font-bold text-stone-500 uppercase">{INGREDIENT_DATA[id].name}</span>
                </div>
              ))}
            </div>
            
            {/* 丢弃按钮：点击清空手持 */}
            <div 
              onClick={() => setHeldItem(null)} 
              className={`w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-lg transition-all active:scale-90 ${heldItem ? 'bg-red-500 border-red-200 animate-pulse' : 'bg-stone-300 border-stone-100'}`}
            >
              <XCircle className="text-white w-8 h-8" />
            </div>
          </div>
        </main>

        {/* 游戏状态 Overlay (Start, Complete, etc.) */}
        {gameState === 'LEVEL_SELECT' && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-8">
            <div className="bg-white rounded-3xl p-6 w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-6 text-center">Select Kitchen</h2>
              <div className="grid grid-cols-4 gap-4">
                {LEVELS.map((level, i) => (
                  <button key={i} onClick={() => startLevel(i)} className="aspect-square bg-stone-100 rounded-2xl font-bold text-xl hover:bg-emerald-100 border-2 border-stone-200">{level.id}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
