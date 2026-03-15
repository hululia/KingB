import React from 'react';
import { XCircle } from 'lucide-react';
import type { IngredientId, Level } from '../types';
import { INGREDIENT_DATA } from '../types';

export default function BottomBar({
  currentLevel,
  takeIngredient,
  trashHeldItem,
  plateImage,
}: {
  currentLevel: Level;
  takeIngredient: (id: IngredientId) => void;
  trashHeldItem: () => void;
  plateImage: string;
}) {
  return (
    <div className="absolute left-0 right-0 bottom-[12%] px-2 flex justify-between items-end gap-1 z-50">
      <div className="grid grid-cols-4 gap-1 max-w-[82%]">
        {currentLevel.unlockedIngredients.map((id) => (
          <div
            key={id}
            onPointerDown={(e) => {
              e.preventDefault();
              takeIngredient(id);
            }}
            className="w-[52px] h-[60px] bg-white/40 rounded-md border border-white/30 shadow-sm flex flex-col items-center justify-center cursor-pointer touch-manipulation"
          >
            <div className="relative w-12 h-12 flex items-center justify-center mb-1">
              <img
                src={INGREDIENT_DATA[id].image}
                alt=""
                className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)] scale-[0.78]"
                referrerPolicy="no-referrer"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = plateImage;
                }}
              />
            </div>

          </div>
        ))}
      </div>

      <div
        onClick={trashHeldItem}
        className="w-14 h-14 bg-red-100 border border-red-200 rounded-full flex items-center justify-center cursor-pointer"
      >
        <XCircle className="w-8 h-8 text-red-500" />
      </div>
    </div>
  );
}
