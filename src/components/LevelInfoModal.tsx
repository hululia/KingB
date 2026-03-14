import React from 'react';
import { X } from 'lucide-react';
import type { LevelConfig, IngredientId } from '../types';
import { RECIPES } from '../types';

const ING_EMOJI: Record<IngredientId, string> = {
  meat: '🥩',
  tomato: '🍅',
  bread: '🍞',
  lettuce: '🥬',
  cheese: '🧀',
  onion: '🧅',
  pickles: '🥒',
  egg: '🍳',
};

const RECIPE_EMOJI: Record<string, string> = {
  burger: '🍔',
  cheeseburger: '🍔',
  deluxe_burger: '🍔',
  salad: '🥗',
  egg_sandwich: '🥪',
};

function recipeLine(recipeId: string) {
  const r = RECIPES[recipeId];
  if (!r) return `${recipeId}`;
  const left = r.ingredients.map((id) => ING_EMOJI[id]).join(' + ');
  const right = RECIPE_EMOJI[recipeId] ?? '🍽️';
  return `${left} = ${right}  ${r.name}`;
}

export default function LevelInfoModal({
  level,
  onClose,
}: {
  level: LevelConfig;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border-2 border-stone-900/10 shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-stone-200">
          <div className="font-bold text-stone-900">{level.name} 做法</div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-stone-100 active:scale-95">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4">
          <div className="text-xs text-stone-500 mb-3">点右上角 ⓘ 可随时查看本关可做菜谱</div>
          <div className="space-y-2">
            {level.availableRecipes.map((rid) => (
              <div key={rid} className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 font-bold text-stone-800">
                {recipeLine(rid)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
