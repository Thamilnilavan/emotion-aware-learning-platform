'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import aiService from '@/services/api/ai';
import type { FrameResult } from '@/types';

const SCAN_INTERVAL_SECONDS = Math.max(
  1,
  parseInt(process.env.NEXT_PUBLIC_SCAN_INTERVAL_SECONDS || '2', 10)
);

export function useWebcam(sessionId: string | null = null) {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraEnabledRef = useRef(true);
  const lastActivity = useRef(Date.now());
  const isProcessingFrame = useRef(false);
  const consecutiveFailures = useRef(0);
  const nextAiAttemptAt = useRef(0);

  const emotionValence: Record<string, number> = {
    happy: 1,
    surprised: 0.75,
    neutral: 0.6,
    fearful: 0.3,
    sad: 0.25,
    disgusted: 0.2,
    angry: 0.15,
  };

  useEffect(() => {
    const updateActivity = () => {
      lastActivity.current = Date.now();
    };
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    return () => {
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keydown', updateActivity);
    };
  }, []);

  const getInteractionScore = useCallback(() => {
    const diff = (Date.now() - lastActivity.current) / 1000;
    if (diff < 3) return 1.0;
    if (diff < 10) return 0.5;
    return 0.0;
  }, []);

  const stopCapture = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setIsCapturing(false);
  }, []);

  const startCapture = useCallback(
    (onFrameResult: (result: FrameResult) => void) => {
      navigator.mediaDevices
        .getUserMedia({ video: { width: 320, height: 240, facingMode: 'user' } })
        .then((stream) => {
          streamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play().catch((playError: DOMException) => {
              // React development remounts and camera source changes can cancel
              // an in-flight play request. This cancellation is harmless.
              if (playError.name !== 'AbortError') {
                console.error('Unable to start webcam preview:', playError);
              }
            });
          }
          setHasPermission(true);
          setIsCapturing(true);
          cameraEnabledRef.current = true;
          setCameraEnabled(true);
          setError(null);

          const intervalMs = SCAN_INTERVAL_SECONDS * 1000;
          intervalRef.current = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (
              !video ||
              !canvas ||
              !cameraEnabledRef.current ||
              isProcessingFrame.current ||
              Date.now() < nextAiAttemptAt.current
            ) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            // Preserve enough facial detail for OpenCV detection. Flask will
            // resize the detected face to EfficientNetB3's 300x300 input.
            canvas.width = 320;
            canvas.height = 240;
            ctx.drawImage(video, 0, 0, 320, 240);

            canvas.toBlob(async (blob) => {
              if (!blob) return;
              isProcessingFrame.current = true;
              const interaction = getInteractionScore();
              const reader = new FileReader();
              reader.onloadend = async () => {
                try {
                  const base64data = reader.result as string;
                  const image = base64data.split(',')[1]; // Remove data URL prefix
                  
                  const result = await aiService.analyzeFrame(image, sessionId || undefined);
                  consecutiveFailures.current = 0;
                  nextAiAttemptAt.current = 0;
                  const emotion = result.emotion || 'neutral';

                  onFrameResult({
                    emotion,
                    confidence: result.emotion_confidence ?? 0,
                    valence: emotionValence[emotion.toLowerCase()] ?? 0.5,
                    attention: result.face_detected === false
                      ? false
                      : result.attention == null
                        ? true
                        : result.attention >= 0.5,
                    yaw: result.yaw ?? 0,
                    pitch: result.pitch ?? 0,
                    fatigue: result.fatigue_level ?? 0,
                    interaction,
                    face_detected: result.face_detected,
                    error: false,
                    color: result.color,
                    description: result.description,
                    class_id: result.class_id,
                    probabilities: result.probabilities,
                  });
                } catch (error) {
                  console.error('AI frame analysis error:', error);
                  consecutiveFailures.current += 1;
                  const retryDelay = Math.min(
                    30000,
                    2000 * (2 ** (consecutiveFailures.current - 1))
                  );
                  nextAiAttemptAt.current = Date.now() + retryDelay;
                  onFrameResult({
                    emotion: 'Neutral',
                    confidence: 0,
                    valence: 0.5,
                    attention: true,
                    yaw: 0,
                    interaction,
                    error: true,
                  });
                } finally {
                  isProcessingFrame.current = false;
                }
              };
              reader.onerror = () => {
                isProcessingFrame.current = false;
              };
              reader.readAsDataURL(blob);
            }, 'image/jpeg', 0.7);
          }, intervalMs);
        })
        .catch((err) => {
          if (err.name === 'NotAllowedError') {
            setHasPermission(false);
            setError('Camera permission denied. Please allow webcam access.');
          } else {
            setError(err.message || 'Failed to access camera');
          }
        });
    },
    [getInteractionScore, sessionId]
  );

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) {
      streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = false; });
      cameraEnabledRef.current = false;
      setCameraEnabled(false);
    } else {
      streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = true; });
      cameraEnabledRef.current = true;
      setCameraEnabled(true);
    }
  }, [cameraEnabled]);

  useEffect(() => () => stopCapture(), [stopCapture]);

  return {
    videoRef,
    canvasRef,
    isCapturing,
    hasPermission,
    cameraEnabled,
    error,
    startCapture,
    stopCapture,
    toggleCamera,
  };
}
