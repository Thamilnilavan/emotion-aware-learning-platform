'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Camera, CameraOff, LogOut, Star, Maximize, Minimize, Settings, FileText, Download, ChevronUp, ChevronDown, X } from 'lucide-react';
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
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [notes, setNotes] = useState('');
  const [showMaterials, setShowMaterials] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'notes' | 'materials'>('notes');
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const { videoRef: webcamRef, canvasRef, cameraEnabled, error: camError, startCapture, stopCapture, toggleCamera } = useWebcam();
  const { currentScore, currentState, addFrame, countdown, windowHistory } = useEngagement(sessionId, sessionStarted);
  const { currentIntervention, dismissIntervention } = useAdaptive(currentState, currentScore, sensitivity);

  const currentContent = course?.content?.sort((a, b) => a.order - b.order)[contentIndex];

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  };

  const getFullVideoUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${backendUrl}${url}`;
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

        console.log('Starting session for course:', courseId);
        const sessionRes = await sessionAPI.start(courseId);
        console.log('Session started:', sessionRes.data);
        setSessionId(sessionRes.data.sessionId);
        setSessionStarted(true);
        toast.success('Session started successfully');
      } catch (err: unknown) {
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

  const saveNotes = () => {
    localStorage.setItem(`notes-${sessionId}`, notes);
    toast.success('Notes saved');
  };

  useEffect(() => {
    if (sessionId) {
      const savedNotes = localStorage.getItem(`notes-${sessionId}`);
      if (savedNotes) setNotes(savedNotes);
    }
  }, [sessionId]);

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

      {/* Main Content Layout - Udemy Style */}
      <div className={`flex h-full w-full flex-col pt-20 md:flex-row md:p-6 md:pt-24 gap-6 overflow-hidden bg-gray-900 ${isFullscreen ? '!p-0 !pt-0' : ''}`}>
        
        {/* Video Player Section */}
        <div className={`flex flex-1 flex-col overflow-hidden ${isFullscreen ? '!flex-1 !h-screen' : ''}`} ref={containerRef}>
          {/* Video Container */}
          <div className={`relative flex aspect-video w-full overflow-hidden bg-black group ${isFullscreen ? '!aspect-auto !h-screen' : ''}`}>
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

            {/* Video Controls Overlay */}
            {currentContent?.contentType === 'video' && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={togglePlay} className="text-white hover:text-white/80">
                      {videoPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                    </button>
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

          {/* Video Info - Compact - Hidden in Fullscreen */}
          {!isFullscreen && (
          <div className="mt-4 bg-white p-4 rounded-lg shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h2 className="text-lg font-bold text-gray-900">{currentContent?.title || course?.title}</h2>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{(currentContent as any)?.description || course?.description}</p>
              </div>
              <button
                onClick={() => {
                  setShowSidebar(true);
                  setSidebarTab('notes');
                }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 transition-colors"
              >
                <FileText className="h-4 w-4" />
                Notes (Tab)
              </button>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {(course as any)?.averageEngagement ? `${((course as any).averageEngagement / 20).toFixed(1)} rating` : 'No rating'}
              </span>
              <span>•</span>
              <span>{course?.content?.length || 0} lectures</span>
              <span>•</span>
              <span>{(course as any)?.totalSessions || 0} sessions completed</span>
            </div>
          </div>
          )}
        </div>

        {/* Course Curriculum Sidebar - Hidden in Fullscreen */}
        {!isFullscreen && (
        <div className="hidden w-[400px] flex-col bg-white rounded-lg shadow-lg overflow-hidden md:flex">
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
                  <span className="text-xs text-gray-500">{(course as any)?.totalSessions || 0} sessions</span>
                </div>
                
                {/* Lessons */}
                <div className="border border-t-0 border-gray-200 rounded-b-lg">
                  {course?.content?.sort((a, b) => a.order - b.order).map((content, index) => (
                    <button
                      key={(content as any)?._id || index}
                      onClick={() => setContentIndex(index)}
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
                        <p className="text-xs text-gray-500">{(content as any)?.description || 'Lecture'}</p>
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

      {/* Floating Action Bar - Hidden in Fullscreen */}
      {!isFullscreen && (
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
      )}

      <video ref={webcamRef} className="hidden" muted playsInline />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
