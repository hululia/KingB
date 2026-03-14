import React from 'react';
import { motion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import type { Station, Ingredient } from '../types';
import { RECIPES, INGREDIENT_DATA, IngredientState } from '../types';

import cookedMeatImage from '../assets/ingredients/meat.png';
import rawMeatImage from '../assets/ingredients/rawmeat.png';

export default function StationsArea({
  stations,
  interactWithStation,
  plateImage,
  stationFryerImage,
  stationGrillImage,
  stationSauceImage,
}: {
  stations: Station[];
  interactWithStation: (stationId: string) => void;
  plateImage: string;
  stationFryerImage: string;
  stationGrillImage: string;
  stationSauceImage: string;
}) {
  return (
    <div className="absolute left-0 right-0 bottom-[25%] px-2 z-30">
      <div className="grid grid-cols-4 gap-1 relative">
        {stations.map((station) => (
          <div
            key={station.id}
            onPointerDown={(e) => {
              e.preventDefault();
              interactWithStation(station.id);
            }}
            className="w-full h-[118px] rounded-xl border-0 flex flex-col items-center justify-center cursor-pointer transition-all relative bg-transparent hover:scale-105 active:scale-95 shadow-lg"
>
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-stone-400 rounded text-[10px] font-bold text-white uppercase tracking-wider">
              {station.id.startsWith('grill')
                ? 'GRILL'
                : station.id.startsWith('fryer')
                  ? 'FRYER'
                  : station.id.startsWith('prep')
                    ? 'PREP'
                    : 'PLATE'}
            </div>

            {/* Station background should ALWAYS show (visual only) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {station.type === 'STOVE' ? (
                <img
                  src={station.id.startsWith('fryer') ? stationFryerImage : stationGrillImage}
                  alt=""
                  className="w-24 h-24 object-contain opacity-95 drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = plateImage;
                  }}
                />
              ) : station.type === 'PREP' ? (
                <img
                  src={stationSauceImage}
                  alt=""
                  className="w-16 h-16 object-contain opacity-95 drop-shadow-[0_4px_3px_rgba(0,0,0,0.3)] scale-[1.2]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = plateImage;
                  }}
                />
              ) : (
                <img
                  src={plateImage}
                  alt="plate"
                  className="w-16 h-16 object-contain opacity-95 scale-[1.2]"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = plateImage;
                  }}
                />
              )}
            </div>

            {station.content && (!Array.isArray(station.content) || station.content.length > 0) ? (
              Array.isArray(station.content) ? (
                <div className="flex flex-col items-center gap-1 relative z-10">
                  {(() => {
                    const ingredients = station.content as Ingredient[];
                    const matchedRecipe = Object.values(RECIPES).find((r) => {
                      const heldIds = ingredients.map((i) => i.id).sort();
                      const reqIds = [...r.ingredients].sort();
                      const isIdsMatch = JSON.stringify(heldIds) === JSON.stringify(reqIds);
                      const isAllCooked = ingredients.every(
                        (ing) => INGREDIENT_DATA[ing.id].cookTime === 0 || ing.state === IngredientState.COOKED,
                      );
                      return isIdsMatch && isAllCooked;
                    });

                    if (matchedRecipe) {
                      return (
                        <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                          <div className="relative w-24 h-24 flex items-center justify-center">
                            <img
                              src={matchedRecipe.image}
                              className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = plateImage;
                              }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                            READY
                          </span>
                        </motion.div>
                      );
                    }

                    return (
                      <div className="flex flex-wrap gap-1 justify-center p-2">
                        {ingredients.map((ing, i) => (
                          <div key={i} className="relative w-8 h-8 flex items-center justify-center">
                            <img
                              src={
                                ing.id === 'meat'
                                  ? ing.state === IngredientState.COOKED
                                    ? cookedMeatImage
                                    : rawMeatImage
                                  : INGREDIENT_DATA[ing.id].image
                              }
                              className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = plateImage;
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 relative z-10">
                  <div className="relative w-24 h-24 flex items-center justify-center">
                    <img
                      src={(() => {
                        const ing = station.content as Ingredient;
                        if (ing.id === 'meat') {
                          // raw + cooking use rawmeat, cooked uses meat
                          return ing.state === IngredientState.COOKED ? cookedMeatImage : rawMeatImage;
                        }
                        return INGREDIENT_DATA[ing.id].image;
                      })()}
                      className={`w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)] ${
                        (station.content as Ingredient).state === IngredientState.COOKING &&
                        (station.content as Ingredient).id === 'meat'
                          ? 'scale-[0.5]'
                          : (station.content as Ingredient).state === IngredientState.COOKING &&
                              (station.content as Ingredient).id === 'tomato'
                            ? 'scale-[0.5]'
                            : (station.content as Ingredient).state === IngredientState.COOKED &&
                                (station.content as Ingredient).id === 'meat'
                              ? 'scale-[0.8]'
                              : ''
                      }`}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = plateImage;
                      }}
                    />
                  </div>
                  {(station.content as Ingredient).state === IngredientState.COOKING && (
                    <div className="w-16 h-2 bg-stone-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500"
                        style={{ width: `${(station.content as Ingredient).progress}%` }}
                      />
                    </div>
                  )}
                  {(station.content as Ingredient).state === IngredientState.COOKED && (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  )}
                </div>
              )
            ) : (
              <div className="relative z-10" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
