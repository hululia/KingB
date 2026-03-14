import React from 'react';
import { motion } from 'motion/react';
import { ChefHat, Play } from 'lucide-react';

export default function StartOverlay({
  onSelectLevel,
}: {
  onSelectLevel: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-stone-900/80 backdrop-blur-md z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-12 max-w-md w-full text-center shadow-2xl"
      >
        <div className="w-24 h-24 bg-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-8">
          <ChefHat className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="font-display text-4xl font-bold mb-4">Kitchen Master</h2>
        <p className="text-stone-500 mb-8 leading-relaxed">
          Manage 20 challenging levels! Cook, assemble, and serve to become the ultimate chef.
        </p>
        <button
          onClick={onSelectLevel}
          className="w-full pixel-start-button flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          SELECT LEVEL
        </button>
      </motion.div>
    </div>
  );
}
