import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import type { Customer } from '../types';
import { RECIPES } from '../types';

export default function CustomerArea({
  customers,
  serveCustomer,
  plateImage,
}: {
  customers: Customer[];
  serveCustomer: (slot: number) => void;
  plateImage: string;
}) {
  return (
    <div className="absolute left-0 right-0 bottom-[40%] h-[220px] flex justify-between px-4 items-end z-10 pointer-events-none">
      {[0, 1, 2].map((slot) => {
        const customer = customers.find((c) => c.slotIndex === slot);
        return (
          <div key={slot} className="w-[122px] flex flex-col items-center justify-end relative">
            <AnimatePresence>
              {customer && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 50, opacity: 0 }}
                  className="flex flex-col items-center pointer-events-auto"
                  onClick={() => serveCustomer(slot)}
                >
                  <div className="absolute bottom-[74%] left-1/2 -translate-x-1/2 z-40 mb-4">
                    <div className="order-bubble scale-90">
                      <div className="flex flex-col items-center gap-1">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                          <img
                            src={RECIPES[customer.order!.recipeId].image}
                            alt=""
                            className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = plateImage;
                            }}
                          />
                        </div>
                        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${
                              customer.patience > 50
                                ? 'bg-emerald-500'
                                : customer.patience > 25
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            animate={{ width: `${customer.patience}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-[190px] h-[190px] relative flex items-end justify-center overflow-visible">
                    <img
                      src={customer.image}
                      alt="Customer"
                      className="w-full h-full object-contain relative z-10 drop-shadow-[0_6px_6px_rgba(0,0,0,0.28)]"
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = plateImage;
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
