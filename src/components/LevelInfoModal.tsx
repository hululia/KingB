import React from 'react';
import { X } from 'lucide-react';
import type { LevelConfig, IngredientId } from '../types';
import { RECIPES, INGREDIENT_DATA } from '../types';

function RecipeLine({ recipeId }: { recipeId: string }) {
  const r = RECIPES[recipeId];
  if (!r) return <div className="font-bold">{recipeId}</div>;

  const outImg = r.image;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {r.ingredients.map((id: IngredientId, idx: number) => (
        <React.Fragment key={`${id}-${idx}`}>
          <img
            src={INGREDIENT_DATA[id].image}
            alt={id}
            className="w-7 h-7 object-contain"
            referrerPolicy="no-referrer"
          />
          {idx < r.ingredients.length - 1 && <span className="font-black text-stone-700">+</span>}
        </React.Fragment>
      ))}
      <span className="font-black text-stone-700">=</span>
      <img src={outImg} alt={r.name} className="w-8 h-8 object-contain" referrerPolicy="no-referrer" />
      <span className="font-bold text-stone-800">{r.name}</span>
    </div>
  );
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
              <div key={rid} className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
                <RecipeLine recipeId={rid} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
