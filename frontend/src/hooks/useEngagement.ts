'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  const active = useRef(false);

  const stopEngagement = useCallback(() => {
    active.current = false;
    if (windowInterval.current) {
      clearInterval(windowInterval.current);
      windowInterval.current = null;
    }
    if (countdownInterval.current) {
      clearInterval(countdownInterval.current);
      countdownInterval.current = null;
    }
    frameBuffer.current = [];
  }, []);

  const addFrame = useCallback((frameResult: FrameResult) => {
    frameBuffer.current.push(frameResult);
  }, []);

  useEffect(() => {
    if (!enabled || !sessionId) {
      stopEngagement();
      return;
    }

    active.current = true;
    // A resumed video starts a clean analysis window. Frames collected before
    // pausing are intentionally discarded by stopEngagement.
    setCountdown(WINDOW_SECONDS);

    countdownInterval.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? WINDOW_SECONDS : prev - 1));
    }, 1000);

    windowInterval.current = setInterval(async () => {
      if (!active.current || frameBuffer.current.length === 0) return;

      const buffer = [...frameBuffer.current];
      frameBuffer.current = [];
      setCountdown(WINDOW_SECONDS);

      try {
        // Map buffer to list of frames for the AI service
        const sessionData = buffer.map(f => ({
          emotion: f.emotion || 'Neutral',
          confidence: f.confidence || 0.5,
          attention: f.attention ? 1 : 0,
          valence: f.valence,
          interaction: f.interaction,
          fatigue: f.fatigue || 0,
          eyesDetected: f.attention !== false
        }));

        const engagementResult = await aiService.calculateEngagement(
          sessionData,
          WINDOW_SECONDS
        );

        // The learner may end the session while the AI request is in flight.
        // Never write the completed result into a session that has since closed.
        if (!active.current) return;

        const score = engagementResult.engagementScore || 0;
        const state = engagementResult.state || 'ENGAGED';
        
        const emotionCounts = buffer.reduce((acc, curr) => {
          const em = curr.emotion || 'Neutral';
          acc[em] = (acc[em] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        const dominant_emotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Neutral';
        
        const avg_attention = engagementResult.attentionScore || 0;
        const avg_valence = buffer.reduce((sum, frame) => sum + frame.valence, 0) / buffer.length;
        const avg_interaction = buffer.reduce((sum, frame) => sum + frame.interaction, 0) / buffer.length;
        const avg_fatigue = buffer.reduce((sum, frame) => sum + (frame.fatigue || 0), 0) / buffer.length;

        if (state === 'DISTRACTED' || state === 'BREAK_NEEDED') {
          negativeCount.current += 1;
        } else {
          negativeCount.current = 0;
        }

        const avgAtt = avg_attention;
        const avgVal = avg_valence;
        const avgInt = avg_interaction;

        try {
          if (!active.current) return;
          await sessionAPI.sendWindow(sessionId, {
            score,
            state,
            dominantEmotion: dominant_emotion,
            attentionScore: avgAtt,
            emotionValence: avgVal,
            interactionScore: avgInt,
            fatigueScore: avg_fatigue,
          });
        } catch (error: any) {
          // Stop sending window data if session is not active
          if (error.response?.status === 400 || error.response?.status === 404) {
            console.log('Session no longer active, stopping window updates');
            stopEngagement();
          } else {
            console.error('Failed to store engagement window:', error);
          }
        }

        setCurrentScore(score);
        setCurrentState(state);
        setWindowHistory((prev) => [...prev, { score, state, timestamp: Date.now() }]);
      } catch {
        // use last known score
      }
    }, WINDOW_SECONDS * 1000);

    return () => {
      stopEngagement();
    };
  }, [sessionId, enabled, stopEngagement]);

  return { currentScore, currentState, windowHistory, addFrame, countdown, stopEngagement };
}
