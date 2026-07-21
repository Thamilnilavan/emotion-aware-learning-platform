'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import aiService from '@/services/api/ai';
import type { FrameResult } from '@/types';

const FRAME_RATE = parseInt(process.env.NEXT_PUBLIC_FRAME_RATE || '10', 10);

export function useWebcam() {
  const [isCapturing, setIsCapturing] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastActivity = useRef(Date.now());

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
            videoRef.current.play();
          }
          setHasPermission(true);
          setIsCapturing(true);
          setCameraEnabled(true);
          setError(null);

          const intervalMs = 1000 / FRAME_RATE;
          intervalRef.current = setInterval(() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            if (!video || !canvas || !cameraEnabled) return;

            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            canvas.width = 96;
            canvas.height = 96;
            ctx.drawImage(video, 0, 0, 96, 96);

            canvas.toBlob(async (blob) => {
              if (!blob) return;
              const interaction = getInteractionScore();
              try {
                // Convert blob to base64
                const reader = new FileReader();
                reader.onloadend = async () => {
                  const base64data = reader.result as string;
                  const image = base64data.split(',')[1]; // Remove data URL prefix
                  
                  const result = await aiService.analyzeFrame(image);
                  
                  onFrameResult({
                    emotion: result.emotion || 'Neutral',
                    confidence: result.confidence || 0.5,
                    valence: 0.6, // Would come from emotion valence mapping
                    attention: result.attention > 50,
                    yaw: result.yaw || 0,
                    interaction,
                    error: false,
                  });
                };
                reader.readAsDataURL(blob);
              } catch {
                onFrameResult({
                  emotion: 'Neutral',
                  confidence: 0.5,
                  valence: 0.6,
                  attention: true,
                  yaw: 0,
                  interaction: getInteractionScore(),
                  error: true,
                });
              }
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
    [cameraEnabled, getInteractionScore]
  );

  const toggleCamera = useCallback(() => {
    if (cameraEnabled) {
      streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = false; });
      setCameraEnabled(false);
    } else {
      streamRef.current?.getVideoTracks().forEach((t) => { t.enabled = true; });
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
