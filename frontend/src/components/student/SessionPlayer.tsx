'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Camera, CameraOff, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { coursesAPI } from '@/services/api/dashboard';
import { sessionAPI } from '@/services/api/sessions';
import { useWebcam } from '@/hooks/useWebcam';
import { useEngagement } from '@/hooks/useEngagement';
import { useAdaptive } from '@/hooks/useAdaptive';
import { useAuth } from '@/contexts/AuthContext';
import { EngagementOverlay } from './EngagementOverlay';
import { InterventionAlert } from './InterventionAlert';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getEmotionEmoji } from '@/lib/utils';
import type { Course, FrameResult } from '@/types';

interface SessionPlayerProps {
  courseId: string;
}

export function SessionPlayer({ courseId }: SessionPlayerProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [videoPaused, setVideoPaused] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState('Neutral');
  const [isAttentive, setIsAttentive] = useState(true);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>(
    user?.preferences?.notificationSensitivity || 'medium'
  );
  const [contentIndex, setContentIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const { videoRef: webcamRef, canvasRef, cameraEnabled, error: camError, startCapture, stopCapture, toggleCamera } = useWebcam();
  const { currentScore, currentState, addFrame, countdown, windowHistory } = useEngagement(sessionId, sessionStarted);
  const { currentIntervention, dismissIntervention } = useAdaptive(currentState, currentScore, sensitivity);

  const currentContent = course?.content?.sort((a, b) => a.order - b.order)[contentIndex];

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  useEffect(() => {
    if (currentIntervention?.pauseVideo) setVideoPaused(true);
  }, [currentIntervention]);

  useEffect(() => {
    if (videoRef.current) {
      if (videoPaused) videoRef.current.pause();
      else videoRef.current.play().catch(() => {});
    }
  }, [videoPaused, currentContent?.url]);

  useEffect(() => {
    async function init() {
      try {
        if (!user?.consent?.given) {
          router.push('/consent');
          return;
        }

        const courseRes = await coursesAPI.getMy();
        const found = courseRes.data.courses.find((c) => c._id === courseId);
        if (!found) {
          const allRes = await coursesAPI.getAll();
          const pub = allRes.data.courses.find((c) => c._id === courseId);
          setCourse(pub || null);
        } else {
          setCourse(found);
        }

        const sessionRes = await sessionAPI.start(courseId);
        setSessionId(sessionRes.data.sessionId);
        setSessionStarted(true);
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
        toast.error(message || 'Failed to start session');
        router.push('/student/dashboard');
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [courseId, router, user]);

  const handleFrame = useCallback((result: FrameResult) => {
    setCurrentEmotion(result.emotion);
    setIsAttentive(result.attention !== false);
    addFrame(result);
  }, [addFrame]);

  useEffect(() => {
    if (sessionStarted) {
      startCapture(handleFrame);
    }
    return () => stopCapture();
  }, [sessionStarted, startCapture, stopCapture, handleFrame]);

  const endSession = async () => {
    stopCapture();
    if (sessionId) {
      try {
        const res = await sessionAPI.end(sessionId);
        router.push(`/student/reports/${res.data.session._id}`);
      } catch {
        router.push('/student/dashboard');
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (videoPaused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
    setVideoPaused(!videoPaused);
    dismissIntervention();
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-gradient-to-br from-slate-900 via-[#1a1a36] to-black text-white overflow-hidden relative font-sans">
      {/* Top Navigation */}
      <div className="absolute top-0 z-50 flex w-full items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-6 py-4">
        <div className="flex items-center gap-4">
          <button onClick={endSession} className="rounded-full bg-white/10 p-2 text-white backdrop-blur-md transition-all hover:bg-white/20">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white/90">{course?.title || 'Learning Session'}</h1>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary"></span>
              </span>
              <span className="text-xs font-semibold text-primary/80">AI Monitoring Active</span>
            </div>
          </div>
        </div>
        
        {/* Hidden on desktop, shown on mobile */}
        <div className="md:hidden">
          <EngagementOverlay score={currentScore} state={currentState} compact />
        </div>
      </div>

      {!cameraEnabled && (
        <div className="absolute top-20 z-50 mx-auto left-0 right-0 flex max-w-md items-center justify-between rounded-xl bg-warning/20 backdrop-blur-md border border-warning/30 px-4 py-3 text-sm text-white shadow-xl">
          <span>AI monitoring paused — camera is off</span>
          <button onClick={toggleCamera} className="font-semibold text-warning hover:text-warning/80">Enable</button>
        </div>
      )}

      {camError && (
        <div className="absolute top-20 z-50 mx-auto left-0 right-0 max-w-md rounded-xl bg-danger/20 backdrop-blur-md border border-danger/30 px-4 py-3 text-sm text-white shadow-xl">{camError}</div>
      )}

      {/* Main Content Layout */}
      <div className="flex h-full w-full flex-col pt-20 md:flex-row md:p-6 md:pt-24 gap-6">
        
        {/* Cinematic Video Container */}
        <div className="relative flex flex-1 flex-col overflow-hidden rounded-2xl md:rounded-3xl border border-white/10 bg-black/50 shadow-[0_0_50px_rgba(165,86,240,0.1)] backdrop-blur-sm z-10">
          <div className="relative flex-1">
            {currentContent?.contentType === 'youtube' ? (
              <iframe
                src={getYouTubeEmbedUrl(currentContent.url) || currentContent.url}
                className="h-full w-full border-none"
                title={currentContent.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : currentContent?.contentType === 'video' ? (
              <video
                ref={videoRef}
                src={currentContent.url}
                className="h-full w-full object-contain"
                controls={false}
                onEnded={endSession}
                autoPlay
                playsInline
              />
            ) : currentContent ? (
              <iframe src={currentContent.url} className="h-full w-full border-none" title={currentContent.title} />
            ) : (
              <div className="flex h-full items-center justify-center text-white/50">
                <p>No content available for this course</p>
              </div>
            )}
            <InterventionAlert
              intervention={currentIntervention}
              onDismiss={() => { dismissIntervention(); if (currentIntervention?.pauseVideo) setVideoPaused(false); }}
              onReplay={() => { if (videoRef.current) { videoRef.current.currentTime = 0; videoRef.current.play(); } dismissIntervention(); setVideoPaused(false); }}
            />
          </div>
        </div>

        {/* Glassmorphic AI Panel */}
        <div className="hidden w-[320px] flex-col rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-5 shadow-2xl md:flex z-10 mb-20 md:mb-0">
          <div className="mb-6 rounded-2xl bg-black/20 p-4 border border-white/5">
            <EngagementOverlay score={currentScore} state={currentState} emotion={currentEmotion} isAttentive={isAttentive} />
          </div>
          
          <div className="relative flex items-center justify-center py-6">
             <div className="absolute inset-0 bg-primary/20 blur-[50px] rounded-full" />
             <div className="relative text-center">
                <p className="text-6xl drop-shadow-2xl">{getEmotionEmoji(currentEmotion)}</p>
                <p className="mt-2 text-sm font-semibold tracking-wide text-white/80 uppercase">{currentEmotion}</p>
             </div>
          </div>
          
          <div className="mt-6 rounded-2xl bg-black/20 p-5 text-center border border-white/5">
            <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Next AI Scan</p>
            <div className="mt-1 flex items-baseline justify-center gap-1">
               <p className="text-3xl font-bold text-primary shadow-primary">{countdown}</p>
               <span className="text-sm font-medium text-primary/70">sec</span>
            </div>
          </div>
          
          <div className="mt-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">Engagement Log</p>
            <div className="space-y-2">
              {windowHistory.slice(-5).reverse().map((w, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-white/5 p-3 text-xs transition-colors hover:bg-white/10 border border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                    <span className="font-semibold text-white/90">{w.state}</span>
                  </div>
                  <span className="font-bold text-primary">{w.score}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-3 shadow-2xl backdrop-blur-xl transition-all hover:bg-white/15">
        <button onClick={togglePlay} className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-[0_0_20px_rgba(165,86,240,0.4)] transition-transform hover:scale-105 active:scale-95">
          {videoPaused ? <Play className="h-5 w-5 ml-1" /> : <Pause className="h-5 w-5" />}
        </button>
        
        <div className="mx-2 h-8 w-px bg-white/10" />
        
        <select
          value={sensitivity}
          onChange={(e) => setSensitivity(e.target.value as 'low' | 'medium' | 'high')}
          className="appearance-none rounded-full border border-white/10 bg-black/30 px-4 py-2 text-sm font-medium text-white/90 backdrop-blur-md focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
        >
          <option value="low" className="bg-slate-900">Low Sensitivity</option>
          <option value="medium" className="bg-slate-900">Normal</option>
          <option value="high" className="bg-slate-900">Strict Focus</option>
        </select>
        
        <div className="mx-2 h-8 w-px bg-white/10 hidden sm:block" />
        
        <button onClick={toggleCamera} className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${cameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-danger/20 text-danger hover:bg-danger/30'}`}>
          {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
        </button>
        
        <div className="mx-2 h-8 w-px bg-white/10" />
        
        <button onClick={endSession} className="flex h-10 items-center gap-2 rounded-full bg-danger/20 px-4 text-sm font-semibold text-danger transition-colors hover:bg-danger/30">
          <LogOut className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
        </button>
      </div>

      <video ref={webcamRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
