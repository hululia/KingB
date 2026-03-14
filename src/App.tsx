/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, lazy, Suspense } from 'react';
import { motion } from 'motion/react';
import { 
  Timer, 
  Coins, 
  Pause, 
  Play, 
  RotateCcw, 
  Flame, 
  Utensils, 
  XCircle,
  ChefHat,
  Trophy,
  ArrowRight,
  Info
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
// 根据你第一张截图，盘子在 backgrounds 文件夹下
import plateImage from './assets/backgrounds/plate.png'; 
import stationFryerImage from './assets/machines/station_grill.png'; // 假设 fryer 在 machines 文件夹，如果不是请调整
import stationGrillImage from './assets/machines/station_grill.png'; // 假设 grill 在 machines 文件夹，如果不是请调整
import stationSauceImage from './assets/machines/station_sauce.png';

import CustomerArea from './components/CustomerArea';
import StationsArea from './components/StationsArea';
import BottomBar from './components/BottomBar';
import LevelInfoModal from './components/LevelInfoModal';

const MAX_CUSTOMERS = 3;

const StartOverlay = lazy(() => import('./components/StartOverlay'));
const LevelSelectOverlay = lazy(() => import('./components/LevelSelectOverlay'));


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
  const [showLevelInfo, setShowLevelInfo] = useState(false);

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

    // 1. If holding a plate, add ingredient directly to it (if it's bread/cheese/lettuce/pickles - items that don't need cooking)
    if (heldItem && Array.isArray(heldItem)) {
      if (INGREDIENT_DATA[id].cookTime === 0) {
        setHeldItem([...heldItem, newIngredient]);
        return;
      }
    }

    // 2. Auto-place bread/cheese/lettuce/pickles into a plate station if hands are empty or holding something else
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

    // 3. Auto-place into prep station if it's a prep item (Tomato, Onion)
    if (id === 'tomato' || id === 'onion') {
      const emptyPrepIndex = stations.findIndex(s => s.type === 'PREP' && !s.content);
      if (emptyPrepIndex !== -1) {
        setStations(prev => {
          const updated = [...prev];
          updated[emptyPrepIndex] = {
            ...updated[emptyPrepIndex],
            content: { ...newIngredient, state: IngredientState.COOKING } // Using COOKING state for prep progress
          };
          return updated;
        });
        return;
      }
    }

    // 4. Auto-place into stove if it's a cookable item and there's an empty stove (Meat, Egg)
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
        return; // Don't set as held item
      }
    }

    // 4. Fallback to holding the item if hands are empty
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

      // 0. Global Auto-Placing for Cooked/Prepped Items from Stove/Prep
      if ((station.type === 'STOVE' || station.type === 'PREP') && station.content && !Array.isArray(station.content)) {
        const ingredient = station.content as Ingredient;
        if (ingredient.state === IngredientState.COOKED) {
          // If holding a plate, add directly to it
          if (heldItem && Array.isArray(heldItem)) {
            setHeldItem([...heldItem, ingredient]);
            newStations[index] = { ...station, content: null };
            return newStations;
          }
          // Otherwise, auto-place into a plate station
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
            
            // If holding a cookable/prep item, place it on the now-empty station
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

        // To Stove (Meat, Egg, etc.)
        if (station.type === 'STOVE' && !isPrepItem) {
          if (!station.content && isCookable) {
            newStations[index] = { 
              ...station, 
              content: { ...heldItem, state: IngredientState.COOKING } 
            };
            setHeldItem(null);
          }
        } 
        // To Prep (Tomato, Onion)
        else if (station.type === 'PREP' && isPrepItem) {
          if (!station.content) {
            newStations[index] = { 
              ...station, 
              content: { ...heldItem, state: IngredientState.COOKING } 
            };
            setHeldItem(null);
          }
        }
        // To Plate (Can add multiple)
        else if (station.type === 'PLATE') {
          const currentPlate = Array.isArray(station.content) ? station.content : [];
          newStations[index] = { 
            ...station, 
            content: [...currentPlate, heldItem] 
          };
          setHeldItem(null);
        }
      } 
      // 2. If hands are empty, pick up from station or auto-place cooked items
      else if (!heldItem && station.content) {
        if (station.type === 'PLATE') {
          const plateContent = station.content as Ingredient[];
          if (plateContent.length > 0) {
            // Auto-serve logic: Check if this plate matches any customer's order
            const matchedCustomer = customers.find(c => {
              if (!c.order) return false;
              const recipe = RECIPES[c.order.recipeId];
              const heldIds = plateContent.map(i => i.id).sort();
              const requiredIds = [...recipe.ingredients].sort();
              const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds);
              const isAllCooked = plateContent.every(ing => {
                const data = INGREDIENT_DATA[ing.id];
                return data.cookTime === 0 || ing.state === IngredientState.COOKED;
              });
              return isIdsMatch && isAllCooked;
            });

            if (matchedCustomer) {
              const recipe = RECIPES[matchedCustomer.order!.recipeId];
              onDishServed(recipe.score);
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
      // 3. If holding a plate (array), place it back on an empty plate station or auto-serve
      else if (heldItem && Array.isArray(heldItem) && station.type === 'PLATE') {
        const plateContent = heldItem as Ingredient[];
        // Try auto-serve first
        const matchedCustomer = customers.find(c => {
          if (!c.order) return false;
          const recipe = RECIPES[c.order.recipeId];
          const heldIds = plateContent.map(i => i.id).sort();
          const requiredIds = [...recipe.ingredients].sort();
          const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds);
          const isAllCooked = plateContent.every(ing => {
            const data = INGREDIENT_DATA[ing.id];
            return data.cookTime === 0 || ing.state === IngredientState.COOKED;
          });
          return isIdsMatch && isAllCooked;
        });

        if (matchedCustomer) {
          const recipe = RECIPES[matchedCustomer.order!.recipeId];
          onDishServed(recipe.score);
          setCustomers(prev => prev.filter(c => c.id !== matchedCustomer.id));
          setHeldItem(null);
        } else {
          const isStationEmpty = !station.content || (Array.isArray(station.content) && station.content.length === 0);
          if (isStationEmpty) {
            newStations[index] = { ...station, content: heldItem };
            setHeldItem(null);
          }
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
    
    // 1. Check ingredients match (including counts)
    const heldIds = heldItem.map(i => i.id).sort();
    const requiredIds = [...recipe.ingredients].sort();
    const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(requiredIds);

    // 2. Check all items that need cooking are cooked
    const isAllCooked = heldItem.every(ing => {
      const data = INGREDIENT_DATA[ing.id];
      return data.cookTime === 0 || ing.state === IngredientState.COOKED;
    });

    if (isIdsMatch && isAllCooked) {
      onDishServed(recipe.score);
      setCustomers(prev => prev.filter(c => c.id !== customer.id));
      setHeldItem(null);
    } else {
      // Visual feedback for wrong order could be added here
      console.log("Order mismatch or undercooked!");
    }
  };

  const trashHeldItem = () => {
    setHeldItem(null);
  };

  return (
    <div className="h-full w-full flex items-center justify-center font-sans overflow-hidden bg-stone-200 relative">
    <div className="relative w-full max-w-[430px] h-full bg-transparent overflow-hidden">
      {/* Background Image - 使用引入的变量 bgImage */}
      <img 
        src={bgImage} 
        alt="" 
        className="absolute inset-0 w-full h-full object-cover object-top opacity-100 pointer-events-none"
        referrerPolicy="no-referrer"
        onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }}
      />
      
      {/* Top Bar (shifted down for iPhone Dynamic Island / safe-area) */}
      <header className="bg-[#8b4f2f]/95 border-b border-[#5d2f1b] shadow-sm z-50 relative pt-[env(safe-area-inset-top)]">
        <div className="h-14 flex items-center justify-between px-2 mt-[3%]">
        <div className="flex items-center gap-2 min-w-0">
          <ChefHat className="text-amber-100 w-5 h-5" />
          <span className="text-amber-50 font-bold text-sm truncate">{currentLevel.name}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowLevelInfo(true)}
            className="bg-black/20 hover:bg-black/30 text-amber-50 px-2 py-1 rounded text-xs font-bold flex items-center gap-1"
            aria-label="Level info"
          >
            <Info className="w-4 h-4" />
          </button>
          <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">
            ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">
            💰 {coins}
          </div>
          <div className="bg-black/25 text-amber-50 px-2 py-1 rounded text-xs font-bold">
            🎯 {currentLevel.id === 21 ? '∞' : currentLevel.targetScore}
          </div>
        </div>
        </div>
      </header>

{/* Main Game Area: 改为 relative 容器，去掉所有 flex 约束 */}
      <main className="h-[calc(100vh-56px)] relative z-0 overflow-hidden">
        
        {/* 1. Customer Area */}
        <CustomerArea customers={customers} serveCustomer={serveCustomer} plateImage={plateImage} />

        {/* 2. Table (z-20, 中间层) */}
        <div className="absolute left-0 right-0 bottom-[5%] z-20 flex justify-center pointer-events-none">
          <img 
            src={counterWoodImage} 
            alt="table" 
            className="w-full h-full object-cover opacity-100 origin-bottom" 
            referrerPolicy="no-referrer" 
            onError={(e)=>(e.currentTarget.style.display='none')} 
          />
        </div>

        {/* 3. Stations */}
        <StationsArea
          stations={stations}
          interactWithStation={interactWithStation}
          plateImage={plateImage}
          stationFryerImage={stationFryerImage}
          stationGrillImage={stationGrillImage}
          stationSauceImage={stationSauceImage}
        />

        {/* Holding Item HUD (only UI; does not change game logic) */}
        {heldItem && (
          <div className="absolute right-3 bottom-24 z-50 pixel-hold-panel">
            <div className="pixel-hold-title">HOLD</div>
            <div className="pixel-hold-items">
              {(() => {
                const items = Array.isArray(heldItem) ? heldItem : [heldItem];
                const show = items.slice(0, 5);
                return (
                  <>
                    {show.map((ing, idx) => (
                      <div key={idx} className="pixel-hold-item">
                        <img
                          src={INGREDIENT_DATA[ing.id].image}
                          alt={ing.name}
                          className="w-full h-full object-contain"
                          referrerPolicy="no-referrer"
                          onError={(e) => { (e.currentTarget as HTMLImageElement).src = plateImage; }}
                        />
                      </div>
                    ))}
                    {items.length > show.length && (
                      <div className="pixel-hold-more">+{items.length - show.length}</div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="pixel-hold-hint">点右下角红色按钮可丢弃</div>
          </div>
        )}

        {/* 4. Bottom Ingredients Area */}
        <BottomBar currentLevel={currentLevel} takeIngredient={takeIngredient} trashHeldItem={trashHeldItem} plateImage={plateImage} />

      </main>


    </div>

      {/* Overlays (lazy-loaded for faster initial load on mobile Safari) */}
      <Suspense fallback={null}>
        {gameState === 'START' && (
          <StartOverlay onSelectLevel={() => setGameState('LEVEL_SELECT')} />
        )}

        {gameState === 'LEVEL_SELECT' && (
          <LevelSelectOverlay levels={LEVELS} onStartLevel={startLevel} />
        )}
      </Suspense>

      {showLevelInfo && (
        <LevelInfoModal level={currentLevel} onClose={() => setShowLevelInfo(false)} />
      )}

      {gameState === 'LEVEL_COMPLETE' && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl"
          >
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="font-display text-4xl font-bold mb-2">Level Complete!</h2>
            <p className="text-stone-500 mb-8">Fantastic job, Chef!</p>
            
            <div className="bg-emerald-50 rounded-2xl p-6 mb-8 border border-emerald-100">
              <span className="text-stone-500 text-sm font-bold uppercase tracking-widest block mb-2">Final Score</span>
              <div className="flex items-center justify-center gap-3">
                <Coins className="w-8 h-8 text-emerald-500" />
                <span className="text-5xl font-mono font-bold text-emerald-700">{coins}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGameState('LEVEL_SELECT')}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-4 rounded-xl transition-all"
              >
                LEVELS
              </button>
              {currentLevelIdx < LEVELS.length - 1 && (
                <button 
                  onClick={() => startLevel(currentLevelIdx + 1)}
                  className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  NEXT LEVEL
                  <ArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'GAMEOVER' && (
        <div className="fixed inset-0 bg-stone-900/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl"
          >
            <h2 className="font-display text-4xl font-bold mb-2">Failed!</h2>
            <p className="text-stone-500 mb-8">You didn't reach the target score of {currentLevel.targetScore}.</p>
            
            <div className="bg-red-50 rounded-2xl p-6 mb-8 border border-red-100">
              <span className="text-stone-500 text-sm font-bold uppercase tracking-widest block mb-2">Your Score</span>
              <div className="flex items-center justify-center gap-3">
                <Coins className="w-8 h-8 text-red-500" />
                <span className="text-5xl font-mono font-bold text-red-700">{coins}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setGameState('LEVEL_SELECT')}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold py-4 rounded-xl transition-all"
              >
                LEVELS
              </button>
              <button 
                onClick={() => startLevel(currentLevelIdx)}
                className="flex-[2] bg-stone-900 hover:bg-stone-800 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-5 h-5" />
                RETRY
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {gameState === 'PAUSED' && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-40 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 flex flex-col gap-4 shadow-2xl">
            <button 
              onClick={() => setGameState('PLAYING')}
              className="bg-emerald-600 text-white px-12 py-4 rounded-xl font-bold shadow-lg flex items-center gap-3 hover:scale-105 transition-transform"
            >
              <Play className="w-6 h-6 fill-current" />
              RESUME
            </button>
            <button 
              onClick={() => setGameState('LEVEL_SELECT')}
              className="bg-stone-100 text-stone-700 px-12 py-4 rounded-xl font-bold flex items-center gap-3 hover:bg-stone-200 transition-colors"
            >
              QUIT TO MENU
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
