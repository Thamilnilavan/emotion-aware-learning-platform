export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'EmoLearn';

export const EMOTIONS = [
  'Happy', 'Neutral', 'Sad', 'Angry', 'Fearful', 'Disgusted', 'Surprised',
] as const;

export const ENGAGEMENT_STATES = [
  'ENGAGED',
  'MILD_DISTRACTION',
  'DISTRACTED',
  'NEGATIVE_AFFECT',
  'BREAK_NEEDED',
] as const;

export const INTERVENTION_TYPES = ['NUDGE', 'ALERT', 'PAUSE', 'SUPPORT', 'BREAK'] as const;

export const EMOTION_COLORS: Record<string, string> = {
  Happy: '#22c55e',
  Neutral: '#a556f0',
  Sad: '#3b82f6',
  Angry: '#ef4444',
  Fearful: '#f59e0b',
  Disgusted: '#84cc16',
  Surprised: '#06b6d4',
};

export const BADGE_TIERS = {
  bronze: { bg: 'bg-amber-700/20', text: 'text-amber-700', border: 'border-amber-600' },
  silver: { bg: 'bg-gray-400/20', text: 'text-gray-600', border: 'border-gray-400' },
  gold: { bg: 'bg-yellow-500/20', text: 'text-yellow-600', border: 'border-yellow-500' },
};
