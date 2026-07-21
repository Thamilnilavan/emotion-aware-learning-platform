'use client';

import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { getScoreColor, getEmotionEmoji, cn } from '@/lib/utils';

interface EngagementOverlayProps {
  score: number;
  state: string;
  emotion?: string;
  isAttentive?: boolean;
  compact?: boolean;
}

function ScoreRing({ score, radius, strokeWidth }: { score: number; radius: number; strokeWidth: number }) {
  const circumference = 2 * Math.PI * radius;
  const spring = useSpring(0, { stiffness: 50, damping: 20 });
  const offset = useTransform(spring, (v) => circumference - (v / 100) * circumference);

  useEffect(() => {
    spring.set(score);
  }, [score, spring]);

  const color = getScoreColor(score);

  return (
    <svg width={(radius + strokeWidth) * 2} height={(radius + strokeWidth) * 2} className="-rotate-90">
      <circle
        cx={radius + strokeWidth}
        cy={radius + strokeWidth}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      <motion.circle
        cx={radius + strokeWidth}
        cy={radius + strokeWidth}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: offset }}
        className="transition-all duration-500"
      />
    </svg>
  );
}

export function EngagementOverlay({ score, state, emotion = 'Neutral', isAttentive = true, compact = false }: EngagementOverlayProps) {
  const stateLabels: Record<string, string> = {
    ENGAGED: 'Engaged',
    MILD_DISTRACTION: 'Mild Distraction',
    DISTRACTED: 'Distracted',
    NEGATIVE_AFFECT: 'Negative Affect',
    BREAK_NEEDED: 'Break Needed',
  };

  if (compact) {
    return (
      <div className="group relative flex items-center" title={`${score}% - ${stateLabels[state] || state} - ${emotion}`}>
        <div className="relative">
          <ScoreRing score={score} radius={16} strokeWidth={4} />
          <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-white">
            {Math.round(score)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 p-4">
      <div className="relative">
        <ScoreRing score={score} radius={40} strokeWidth={6} />
        <motion.span
          key={score}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-heading"
        >
          {Math.round(score)}
        </motion.span>
      </div>
      <p className={cn('text-sm font-semibold', score >= 70 ? 'text-success' : score >= 45 ? 'text-warning' : 'text-danger')}>
        {stateLabels[state] || state}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-2xl">{getEmotionEmoji(emotion)}</span>
        <span className="text-sm text-body">{emotion}</span>
      </div>
      <div className="flex items-center gap-1.5 text-sm">
        {isAttentive ? (
          <Eye className="h-4 w-4 text-success" />
        ) : (
          <EyeOff className="h-4 w-4 text-body" />
        )}
        <span className={isAttentive ? 'text-success' : 'text-body'}>
          {isAttentive ? 'Focused' : 'Looking away'}
        </span>
      </div>
    </div>
  );
}
