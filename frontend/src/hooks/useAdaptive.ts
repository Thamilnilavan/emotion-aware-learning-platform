'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import type { Intervention } from '@/types';

type Sensitivity = 'low' | 'medium' | 'high';

const COOL_DOWNS: Record<Sensitivity, Record<string, number>> = {
  low: { NUDGE: 600, ALERT: 1200, PAUSE: 1800, SUPPORT: 1800, BREAK: Infinity },
  medium: { NUDGE: 300, ALERT: 600, PAUSE: 900, SUPPORT: 1200, BREAK: Infinity },
  high: { NUDGE: 120, ALERT: 300, PAUSE: 600, SUPPORT: 600, BREAK: Infinity },
};

export function useAdaptive(
  state: string,
  score: number,
  sensitivity: Sensitivity = 'medium'
) {
  const [currentIntervention, setCurrentIntervention] = useState<Intervention | null>(null);
  const lastFired = useRef<Record<string, number>>({});
  const distractionCount = useRef(0);

  const canFire = useCallback(
    (key: string) => {
      const cooldownSeconds = COOL_DOWNS[sensitivity][key];
      if (cooldownSeconds === Infinity) return lastFired.current[key] === undefined;
      return Date.now() - (lastFired.current[key] || 0) > cooldownSeconds * 1000;
    },
    [sensitivity]
  );

  const fire = useCallback((key: string, intervention: Intervention) => {
    lastFired.current[key] = Date.now();
    setCurrentIntervention(intervention);
  }, []);

  useEffect(() => {
    if (state === 'ENGAGED') {
      distractionCount.current = 0;
      setCurrentIntervention(null);
      return;
    }

    if (state === 'MILD_DISTRACTION' && canFire('NUDGE')) {
      fire('NUDGE', { type: 'NUDGE', message: null, pauseVideo: false });
      return;
    }

    if (state === 'DISTRACTED') {
      distractionCount.current += 1;
      if (distractionCount.current === 1 && canFire('ALERT')) {
        fire('ALERT', {
          type: 'ALERT',
          message: 'You seem distracted — ready to continue?',
          pauseVideo: false,
        });
      } else if (distractionCount.current >= 2 && canFire('PAUSE')) {
        fire('PAUSE', {
          type: 'PAUSE',
          message: 'Video paused. Take a moment, then resume when ready.',
          pauseVideo: true,
        });
      }
      return;
    }

    if (state === 'NEGATIVE_AFFECT' && canFire('SUPPORT')) {
      fire('SUPPORT', {
        type: 'SUPPORT',
        message: 'This seems challenging — want to replay this section?',
        pauseVideo: false,
      });
      return;
    }

    if (state === 'BREAK_NEEDED' && canFire('BREAK')) {
      fire('BREAK', {
        type: 'BREAK',
        message: 'You have been studying for a while. A break will help!',
        pauseVideo: true,
        showTimer: true,
      });
    }
  }, [state, score, canFire, fire]);

  const dismissIntervention = useCallback(() => {
    setCurrentIntervention(null);
  }, []);

  return { currentIntervention, dismissIntervention };
}
