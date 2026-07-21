'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import axios from 'axios';
import { sessionAPI } from '@/services/api/sessions';
import aiService from '@/services/api/ai';
import type { FrameResult } from '@/types';

const WINDOW_SECONDS = parseInt(process.env.NEXT_PUBLIC_WINDOW_SECONDS || '30', 10);

interface WindowHistoryItem {
  score: number;
  state: string;
  timestamp: number;
}

export function useEngagement(sessionId: string | null, enabled = true) {
  const [currentScore, setCurrentScore] = useState(0);
  const [currentState, setCurrentState] = useState('ENGAGED');
  const [windowHistory, setWindowHistory] = useState<WindowHistoryItem[]>([]);
  const [countdown, setCountdown] = useState(WINDOW_SECONDS);

  const frameBuffer = useRef<FrameResult[]>([]);
  const negativeCount = useRef(0);
  const windowInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const addFrame = useCallback((frameResult: FrameResult) => {
    frameBuffer.current.push(frameResult);
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) return;

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? WINDOW_SECONDS : prev - 1));
    }, 1000);

    windowInterval.current = setInterval(async () => {
      if (frameBuffer.current.length === 0) return;

      const buffer = [...frameBuffer.current];
      frameBuffer.current = [];
      setCountdown(WINDOW_SECONDS);

      try {
        // Map buffer to list of frames for the AI service
        const sessionData = buffer.map(f => ({
          emotion: f.emotion || 'Neutral',
          confidence: f.confidence || 0.5,
          attention: f.attention ? 100 : 0,
          eyesDetected: f.attention !== false
        }));

        const engagementResult = await aiService.calculateEngagement(
          sessionData,
          WINDOW_SECONDS
        );

        const score = engagementResult.engagementScore || 0;
        const state = engagementResult.state || 'ENGAGED';
        
        const emotionCounts = buffer.reduce((acc, curr) => {
          const em = curr.emotion || 'Neutral';
          acc[em] = (acc[em] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const dominant_emotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
        
        const avg_attention = engagementResult.attentionScore || 0;
        const avg_valence = 0.6; // Would come from emotion valence
        const avg_interaction = 0.5; // Would come from interaction data

        if (state === 'DISTRACTED' || state === 'BREAK_NEEDED') {
          negativeCount.current += 1;
        } else {
          negativeCount.current = 0;
        }

        const avgAtt = avg_attention;
        const avgVal = avg_valence;
        const avgInt = avg_interaction;

        try {
          await sessionAPI.sendWindow(sessionId, {
            score,
            state,
            dominantEmotion: dominant_emotion,
            attentionScore: avgAtt,
            emotionValence: avgVal,
            interactionScore: avgInt,
          });
        } catch {
          // silently continue
        }

        setCurrentScore(score);
        setCurrentState(state);
        setWindowHistory((prev) => [...prev, { score, state, timestamp: Date.now() }]);
      } catch {
        // use last known score
      }
    }, WINDOW_SECONDS * 1000);

    return () => {
      if (windowInterval.current) clearInterval(windowInterval.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [sessionId, enabled]);

  return { currentScore, currentState, windowHistory, addFrame, countdown };
}
