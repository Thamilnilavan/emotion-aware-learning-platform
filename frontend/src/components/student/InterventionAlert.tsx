'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Pause, AlertTriangle, Heart, Coffee } from 'lucide-react';
import type { Intervention } from '@/types';

interface InterventionAlertProps {
  intervention: Intervention | null;
  onDismiss: () => void;
  onReplay?: () => void;
}

export function InterventionAlert({ intervention, onDismiss, onReplay }: InterventionAlertProps) {
  useEffect(() => {
    if (!intervention) return;
    if (intervention.type === 'NUDGE') {
      const t = setTimeout(onDismiss, 10000);
      return () => clearTimeout(t);
    }
    if (intervention.type === 'ALERT') {
      const t = setTimeout(onDismiss, 30000);
      return () => clearTimeout(t);
    }
    if (intervention.type === 'SUPPORT') {
      const t = setTimeout(onDismiss, 60000);
      return () => clearTimeout(t);
    }
  }, [intervention, onDismiss]);

  return (
    <AnimatePresence>
      {intervention && (
        <>
          {intervention.type === 'NUDGE' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="fixed right-6 top-20 z-50 h-3.5 w-3.5 rounded-full bg-primary animate-pulse-teal"
            />
          )}

          {intervention.type === 'ALERT' && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              className="fixed right-4 top-20 z-50 max-w-sm rounded-2xl bg-warning p-4 text-white shadow-xl md:right-6"
            >
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div>
                  <p className="text-sm font-medium">{intervention.message}</p>
                  <button onClick={onDismiss} className="mt-3 rounded-xl bg-white/20 px-4 py-2 text-sm font-semibold hover:bg-white/30">
                    I am ready ✓
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {intervention.type === 'PAUSE' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/70"
            >
              <div className="mx-4 max-w-md rounded-3xl bg-white p-8 text-center shadow-2xl">
                <Pause className="mx-auto mb-4 h-16 w-16 text-primary" />
                <p className="mb-6 text-heading">{intervention.message}</p>
                <button onClick={onDismiss} className="rounded-2xl bg-primary px-8 py-3 font-semibold text-white hover:bg-primary-hover">
                  ▶ Resume
                </button>
              </div>
            </motion.div>
          )}

          {intervention.type === 'SUPPORT' && (
            <motion.div
              initial={{ x: 300 }}
              animate={{ x: 0 }}
              exit={{ x: 300 }}
              className="fixed right-0 top-1/3 z-50 w-full max-w-sm overflow-hidden rounded-l-3xl bg-white shadow-2xl md:w-96"
            >
              <div className="flex items-center gap-2 bg-primary px-6 py-4 text-white">
                <Heart className="h-5 w-5" />
                <span className="font-semibold">Support</span>
              </div>
              <div className="p-6">
                <p className="mb-6 text-heading">{intervention.message}</p>
                <div className="flex gap-3">
                  <button onClick={onReplay} className="flex-1 rounded-2xl border border-primary py-2.5 text-sm font-semibold text-primary hover:bg-primary/5">
                    Replay section
                  </button>
                  <button onClick={onDismiss} className="flex-1 rounded-2xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-hover">
                    Continue
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {intervention.type === 'BREAK' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#0B3D6B]"
            >
              <BreakOverlay message={intervention.message || ''} onDismiss={onDismiss} />
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}

function BreakOverlay({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;

  return (
    <div className="mx-4 max-w-lg text-center text-white">
      <Coffee className="mx-auto mb-6 h-20 w-20 text-[#00BCD4]" />
      <h2 className="mb-4 text-3xl font-bold">Time for a break</h2>
      <p className="mb-8 text-white/80">{message}</p>
      <p className="mb-8 text-5xl font-mono font-bold text-[#00BCD4]">
        {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
      </p>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <button onClick={onDismiss} className="rounded-2xl bg-[#00BCD4] px-8 py-3 font-semibold text-[#0B3D6B]">
          Take a break ☕
        </button>
        <button onClick={onDismiss} className="rounded-2xl border border-white/30 px-8 py-3 font-semibold hover:bg-white/10">
          Skip break
        </button>
      </div>
    </div>
  );
}
