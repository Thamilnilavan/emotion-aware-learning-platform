import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} minutes`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return `${hours}h ${rem}m`;
}

export function getScoreColor(score: number): string {
  if (score >= 70) return '#22c55e';
  if (score >= 45) return '#f59e0b';
  return '#ef4444';
}

export function getEmotionEmoji(emotion: string): string {
  const map: Record<string, string> = {
    Happy: '😊',
    Neutral: '😐',
    Sad: '😢',
    Angry: '😠',
    Fearful: '😨',
    Disgusted: '🤢',
    Surprised: '😲',
    'No Face': '❓',
  };
  return map[emotion] || '😐';
}
