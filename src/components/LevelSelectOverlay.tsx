import React from 'react';
import { motion } from 'motion/react';
import type { Level } from '../types';

export default function LevelSelectOverlay({
  levels,
  onStartLevel,
}: {
  levels: Level[];
  onStartLevel: (idx: number) => void;
}) {
  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white rounded-3xl p-8 max-w-4xl w-full shadow-2xl max-h-[80vh] flex flex-col"
      >
        <h2 className="font-display text-3xl font-bold mb-6 text-center">Select Level</h2>
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-4 overflow-y-auto p-2">
          {levels.map((level, idx) => (
            <button
              key={level.id}
              onClick={() => onStartLevel(idx)}
              className="aspect-square bg-stone-100 hover:bg-emerald-100 border-2 border-stone-200 hover:border-emerald-300 rounded-2xl flex flex-col items-center justify-center transition-all group"
            >
              <span className="text-2xl font-display font-bold text-stone-700 group-hover:text-emerald-700">{level.id}</span>
              <span className="text-[8px] font-bold text-stone-400 uppercase">
                {level.id === 21 ? 'Endless Mode' : `Target: ${level.targetScore}`}
              </span>
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
