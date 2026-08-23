'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Pause, Camera, CameraOff, LogOut, Maximize, Minimize, Settings, FileText, Download, ChevronUp, ChevronDown, X, RotateCcw, RotateCw } from 'lucide-react';
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
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentContentProgress, setCurrentContentProgress] = useState(0);
  const [savedPositions, setSavedPositions] = useState<Record<number, number>>({});
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [videoTime, setVideoTime] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showMaterials, setShowMaterials] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'notes' | 'materials'>('notes');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initializationStarted = useRef(false);
  const lastProgressSync = useRef(0);
  const sessionEnding = useRef(false);
  const lastRecordedIntervention = useRef<string | null>(null);

  const { videoRef: webcamRef, canvasRef, cameraEnabled, error: camError, startCapture, stopCapture, toggleCamera } = useWebcam(sessionId);
  const monitoringActive = sessionStarted && !videoPaused;
  const { currentScore, currentState, addFrame, countdown, windowHistory, stopEngagement } = useEngagement(sessionId, monitoringActive);
  const { currentIntervention, dismissIntervention } = useAdaptive(currentState, currentScore, sensitivity);

  const currentContent = course?.content ? [...course.content].sort((a, b) => a.order - b.order)[contentIndex] : undefined;

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getFullVideoUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
    const origin = backendUrl.replace(/\/api\/?$/, '');
    return `${origin}${url}`;
  };

  useEffect(() => {
    if (currentIntervention?.pauseVideo) setVideoPaused(true);
    if (currentIntervention && sessionId) {
      const key = `${currentIntervention.type}:${currentState}:${currentScore}`;
      if (lastRecordedIntervention.current !== key) {
        lastRecordedIntervention.current = key;
        void sessionAPI.recordIntervention(sessionId, {
          type: currentIntervention.type,
          message: currentIntervention.message,
          state: currentState,
          score: currentScore,
        }).catch(() => {});
      }
    }
  }, [currentIntervention, currentScore, currentState, sessionId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (videoPaused) {
      video.pause();
      return;
    }

    const startPlayback = () => {
      video.play().catch((error: DOMException) => {
        // A source change can cancel an earlier play request. This is expected
        // and should not surface as a runtime error.
        if (error.name !== 'AbortError') {
          console.error('Unable to start video playback:', error);
        }
      });
    };

    if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
      startPlayback();
    } else {
      video.addEventListener('canplay', startPlayback, { once: true });
    }

    return () => video.removeEventListener('canplay', startPlayback);
  }, [videoPaused, currentContent?.url]);

  useEffect(() => {
    // React Strict Mode runs effects twice in development. Guard this side
    // effect so one page visit creates exactly one backend session.
    if (initializationStarted.current) return;
    initializationStarted.current = true;

    async function init() {
      try {
        if (!user?.consent?.given) {
          router.push('/consent');
          return;
        }

        const courseRes = await coursesAPI.getById(courseId);
        setCourse(courseRes.data.course);

        console.log('Starting session for course:', courseId);
        const sessionRes = await sessionAPI.start(courseId);
        console.log('Session started:', sessionRes.data);
        setSessionId(sessionRes.data.sessionId);
        setOverallProgress(sessionRes.data.overallProgress || 0);
        setSavedPositions(Object.fromEntries(
          (sessionRes.data.contentProgress || []).map((item) => [item.contentIndex, item.positionSeconds])
        ));
        setNotes(sessionRes.data.notes || '');
        setSessionStarted(true);
        toast.success('Session started successfully');
      } catch (err: unknown) {
        initializationStarted.current = false;
        console.error('Failed to start session:', err);
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
    // A network/service failure is not a learner emotion. Keep the last valid
    // display and exclude the synthetic fallback from engagement aggregation.
    if (result.error) return;
    setCurrentEmotion(result.emotion);
    setIsAttentive(result.attention !== false);
    addFrame(result);
  }, [addFrame]);

  useEffect(() => {
    if (monitoringActive) {
      startCapture(handleFrame);
    }
    return () => stopCapture();
  }, [monitoringActive, startCapture, stopCapture, handleFrame]);

  const updateLearningProgress = useCallback(async (
    positionSeconds: number,
    durationSeconds: number,
    force = false
  ) => {
    if (!sessionId || !Number.isFinite(durationSeconds) || durationSeconds <= 0) return;

    const percent = Math.min(100, Math.max(0, (positionSeconds / durationSeconds) * 100));
    setCurrentContentProgress(percent);
    setSavedPositions((previous) => ({ ...previous, [contentIndex]: positionSeconds }));

    const now = Date.now();
    if (!force && now - lastProgressSync.current < 5000) return;
    lastProgressSync.current = now;

    try {
      const response = await sessionAPI.updateProgress(sessionId, {
        contentIndex,
        positionSeconds,
        durationSeconds,
        percent,
      });
      setOverallProgress(response.data.overallProgress);
    } catch (error) {
      // Only show toast on repeated failures to avoid spam
      if (Math.random() < 0.1) {
        toast.error('Progress sync failed - will retry automatically');
      }
    }
  }, [sessionId, contentIndex]);

  const handleContentEnded = useCallback(async () => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      await updateLearningProgress(video.duration, video.duration, true);
    }

    const totalItems = course?.content?.length || 0;
    if (contentIndex < totalItems - 1) {
      setContentIndex((current) => current + 1);
      setCurrentContentProgress(0);
      setVideoPaused(false);
    } else {
      await endSession();
    }
  // endSession is intentionally resolved at call time after the final item.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentIndex, course?.content?.length, updateLearningProgress]);

  const endSession = async () => {
    // Video completion, keyboard actions and buttons can request termination at
    // nearly the same time. Only the first request owns the shutdown sequence.
    if (sessionEnding.current) return;
    sessionEnding.current = true;
    stopEngagement();
    setSessionStarted(false);

    const activeVideo = videoRef.current;
    if (activeVideo && Number.isFinite(activeVideo.duration) && activeVideo.duration > 0) {
      await updateLearningProgress(activeVideo.currentTime, activeVideo.duration, true);
      activeVideo.pause();
    }
    stopCapture();
    if (sessionId) {
      try {
        console.log('Ending session:', sessionId);
        const res = await sessionAPI.end(sessionId);
        console.log('Session ended successfully:', res.data);
        if (res.data.success && res.data.session) {
          router.push(`/student/reports/${res.data.session._id}`);
        } else {
          console.error('Invalid session end response:', res.data);
          toast.error('Invalid session response');
          router.push('/student/dashboard');
        }
      } catch (error: any) {
        console.error('Failed to end session:', error);
        console.error('Error response:', error?.response?.data);
        console.error('Error message:', error?.message);
        toast.error(`Failed to end session: ${error?.response?.data?.message || error?.message || 'Unknown error'}`);
        router.push('/student/dashboard');
      }
    } else {
      sessionEnding.current = false;
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setShowSettings(false);
  };

  const seekVideo = (time: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    const nextTime = Math.min(video.duration, Math.max(0, time));
    video.currentTime = nextTime;
    setVideoTime(nextTime);
    void updateLearningProgress(nextTime, video.duration, true);
  };

  const formatVideoTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return hours > 0
      ? `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`
      : `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const saveNotes = async () => {
    if (!sessionId) return;
    try {
      await sessionAPI.updateNotes(sessionId, notes);
      toast.success('Notes saved securely');
    } catch {
      toast.error('Unable to save notes');
    }
  };

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setShowSidebar(!showSidebar);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [showSidebar]);

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
        
        <div className="flex items-center gap-3">
          <div className="md:hidden">
            <EngagementOverlay score={currentScore} state={currentState} compact />
          </div>
          {!isFullscreen && (
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/45 p-2 shadow-2xl backdrop-blur-xl">
              <button
                onClick={togglePlay}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20 text-white shadow-[0_0_18px_rgba(165,86,240,0.28)] transition hover:bg-primary/35"
                aria-label={videoPaused ? 'Play' : 'Pause'}
              >
                {videoPaused ? <Play className="ml-0.5 h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <div className="h-7 w-px bg-white/10" />
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(e.target.value as 'low' | 'medium' | 'high')}
                className="hidden h-9 min-w-28 appearance-none rounded-full border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-primary/50 sm:block"
                aria-label="Monitoring sensitivity"
              >
                <option value="low" className="bg-slate-900">Low</option>
                <option value="medium" className="bg-slate-900">Normal</option>
                <option value="high" className="bg-slate-900">Strict</option>
              </select>
              <div className="hidden h-7 w-px bg-white/10 sm:block" />
              <button
                onClick={toggleCamera}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${cameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-danger/20 text-danger hover:bg-danger/30'}`}
                aria-label={cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
              >
                {cameraEnabled ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
              </button>
              <button
                onClick={toggleFullscreen}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10"
                aria-label="Enter fullscreen"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          )}
          <button onClick={endSession} className="flex h-10 items-center gap-2 rounded-full bg-danger/20 px-4 text-sm font-semibold text-danger backdrop-blur-md transition-colors hover:bg-danger/30">
            <LogOut className="h-4 w-4" /> <span>Exit</span>
          </button>
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

      {/* Main Content Layout - Udemy Style */}
      <div className={`flex h-full w-full flex-col pt-20 md:flex-row md:p-6 md:pt-24 gap-6 overflow-hidden bg-gray-900 ${isFullscreen ? '!p-0 !pt-0' : ''}`}>
        
        {/* Video Player Section */}
        <div className={`flex flex-1 flex-col overflow-hidden ${isFullscreen ? '!flex-1 !h-screen' : ''}`} ref={containerRef}>
          {/* Video Container */}
          <div className={`relative flex aspect-video w-full overflow-hidden bg-black group md:h-full md:aspect-auto ${isFullscreen ? '!aspect-auto !h-screen' : ''}`}>
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
                src={getFullVideoUrl(currentContent.url)}
                className="h-full w-full object-contain"
                controls={false}
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  setVideoTime(video.currentTime);
                  void updateLearningProgress(video.currentTime, video.duration);
                }}
                onLoadedMetadata={(event) => {
                  setVideoDuration(event.currentTarget.duration);
                  const savedPosition = savedPositions[contentIndex] || 0;
                  if (savedPosition > 0 && savedPosition < event.currentTarget.duration) {
                    event.currentTarget.currentTime = savedPosition;
                    setVideoTime(savedPosition);
                  }
                }}
                onEnded={() => void handleContentEnded()}
                onPause={() => setVideoPaused(true)}
                onPlay={() => setVideoPaused(false)}
                autoPlay
                playsInline
              />
            ) : currentContent ? (
              <iframe src={getFullVideoUrl(currentContent.url)} className="h-full w-full border-none bg-white" title={currentContent.title} />
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

            {/* Video Controls Overlay */}
            {currentContent?.contentType === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                  type="range"
                  min={0}
                  max={videoDuration || 0}
                  step={0.1}
                  value={Math.min(videoTime, videoDuration || 0)}
                  onChange={(event) => seekVideo(Number(event.target.value))}
                  className="mb-3 h-1.5 w-full cursor-pointer accent-primary"
                  aria-label="Video position"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={() => seekVideo(videoTime - 10)} className="relative text-white hover:text-white/80" aria-label="Rewind 10 seconds">
                      <RotateCcw className="h-5 w-5" />
                      <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[7px] font-bold">10</span>
                    </button>
                    <button onClick={togglePlay} className="text-white hover:text-white/80">
                      {videoPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </button>
                    <button onClick={() => seekVideo(videoTime + 10)} className="relative text-white hover:text-white/80" aria-label="Forward 10 seconds">
                      <RotateCw className="h-5 w-5" />
                      <span className="absolute inset-0 flex items-center justify-center pt-0.5 text-[7px] font-bold">10</span>
                    </button>
                    <span className="min-w-max text-xs font-medium tabular-nums text-white/90">
                      {formatVideoTime(videoTime)} / {formatVideoTime(videoDuration)}
                    </span>
                    <div className="relative">
                      <button
                        onClick={() => setShowSettings(!showSettings)}
                        className="text-white hover:text-white/80"
                      >
                        <Settings className="h-5 w-5" />
                      </button>
                      {showSettings && (
                        <div className="absolute bottom-8 left-0 bg-black/90 rounded-lg p-2 min-w-[150px]">
                          <p className="text-xs text-white/70 mb-2">Playback Speed</p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                            <button
                              key={speed}
                              onClick={() => handleSpeedChange(speed)}
                              className={`block w-full text-left px-2 py-1 text-sm rounded ${
                                playbackSpeed === speed ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/10'
                              }`}
                            >
                              {speed}x
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={toggleFullscreen}
                    className="text-white hover:text-white/80"
                  >
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Course Curriculum Sidebar - Hidden in Fullscreen */}
        {!isFullscreen && (
        <div className="hidden w-[400px] flex-col self-stretch bg-white rounded-lg shadow-lg overflow-hidden md:flex md:h-full">
          {/* AI Monitoring Header */}
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">AI Monitoring</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getEmotionEmoji(currentEmotion)}</span>
                <span className="text-xs font-semibold text-gray-600 uppercase">{currentEmotion}</span>
              </div>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-white p-3 border border-gray-200">
              <div>
                <p className="text-xs text-gray-500">Engagement Score</p>
                <p className="text-lg font-bold text-purple-600">{currentScore}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Next Scan</p>
                <p className="text-lg font-bold text-purple-600">{countdown}s</p>
              </div>
            </div>
            <div className="mt-3 rounded-lg border border-gray-200 bg-white p-3">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-medium text-gray-600">Learning Progress</span>
                <span className="font-bold text-purple-600">{Math.round(overallProgress)}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-purple-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, overallProgress))}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-gray-500">
                Current lesson: {Math.round(currentContentProgress)}%
              </p>
            </div>
          </div>

          {/* Course Content - Scrollable */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="p-4">
              <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Course Content</h3>
              
              {/* Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">Course Content</span>
                    <span className="text-xs text-gray-500">{course?.content?.length || 0} lectures</span>
                  </div>
                  <span className="text-xs text-gray-500">{course?.totalSessions || 0} sessions</span>
                </div>
                
                {/* Lessons */}
                <div className="border border-t-0 border-gray-200 rounded-b-lg">
                  {course?.content?.sort((a, b) => a.order - b.order).map((content, index) => (
                    <button
                      key={content._id || index}
                      onClick={() => {
                        setContentIndex(index);
                        setCurrentContentProgress(0);
                        setVideoPaused(false);
                      }}
                      className={`w-full flex items-center gap-3 p-3 text-left border-b border-gray-100 last:border-b-0 transition-all ${
                        contentIndex === index 
                          ? 'bg-purple-50 border-l-4 border-l-purple-600' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-gray-200">
                        {contentIndex === index ? (
                          <Play className="h-4 w-4 text-purple-600 fill-purple-600" />
                        ) : (
                          <Play className="h-4 w-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          contentIndex === index ? 'text-purple-700' : 'text-gray-900'
                        }`}>
                          {content.title}
                        </p>
                        <p className="text-xs text-gray-500">{content.description || 'Lecture'}</p>
                      </div>
                      {contentIndex === index && (
                        <div className="text-xs text-purple-600 font-semibold">Playing</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Engagement Log */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <h3 className="mb-3 text-sm font-bold text-gray-900 uppercase tracking-wider">Engagement Log</h3>
              <div className="space-y-2">
                {windowHistory.slice(-5).reverse().map((w, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-white p-3 text-xs border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="flex h-2 w-2 rounded-full bg-purple-500" />
                      <span className="font-semibold text-gray-900">{w.state}</span>
                    </div>
                    <span className="font-bold text-purple-600">{w.score}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Slide-in Sidebar for Notes/Materials */}
        {showSidebar && (
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black/50"
              onClick={() => setShowSidebar(false)}
            />
            <div className="relative w-[400px] bg-white shadow-2xl h-full overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => setSidebarTab('notes')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sidebarTab === 'notes' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Notes
                  </button>
                  <button
                    onClick={() => setSidebarTab('materials')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      sidebarTab === 'materials' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    Materials
                  </button>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4">
                {sidebarTab === 'notes' ? (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-bold text-gray-900">Your Notes</h3>
                      <button onClick={saveNotes} className="text-sm font-medium text-purple-600 hover:text-purple-700">
                        Save Notes
                      </button>
                    </div>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Take notes during this lecture..."
                      className="w-full h-64 p-4 border border-gray-300 rounded-lg text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                    />
                    <p className="mt-2 text-xs text-gray-500">Press Tab to toggle this sidebar</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Course Materials</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Lecture Slides</span>
                        </div>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Course Notes</span>
                        </div>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-gray-500" />
                          <span className="text-sm font-medium text-gray-900">Assignment</span>
                        </div>
                        <button className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors">
                          <Download className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <video ref={webcamRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
