'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Play, Pause, SkipBack, SkipForward, Camera, BarChart3, X, Eye, Smile } from 'lucide-react';
import { toast } from 'sonner';
import { sessionAPI } from '@/services/api/sessions';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { getScoreColor } from '@/lib/utils';

function LearningSessionContent() {
  const { courseId } = useParams();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionActive, setSessionActive] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [engagementScore, setEngagementScore] = useState(0);
  const [emotion, setEmotion] = useState('Neutral');
  const [attention, setAttention] = useState(0);
  const [state, setState] = useState('ENGAGED');
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showNudge, setShowNudge] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showPause, setShowPause] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [showBreak, setShowBreak] = useState(false);
  const [breakCountdown, setBreakCountdown] = useState(300);
  const [loading, setLoading] = useState(false);
  
  const frameBufferRef = useRef<any[]>([]);
  const aiIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scoreIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const breakIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const emotionEmojis: Record<string, string> = {
    Happy: '😊',
    Focused: '🎯',
    Neutral: '😐',
    Curious: '🤔',
    Engaged: '💪',
    Sad: '😢',
    Angry: '😠',
    Fearful: '😨',
    Disgusted: '🤢',
  };

  const getStateLabel = (score: number) => {
    if (score >= 70) return 'Engaged';
    if (score >= 45) return 'Mildly Distracted';
    if (score >= 20) return 'Distracted';
    return 'Break Needed';
  };

  const startSession = async () => {
    setLoading(true);
    try {
      console.log('Starting session with courseId:', courseId);
      const response = await sessionAPI.start(courseId as string | undefined);
      console.log('Session start response:', response.data);
      setSessionId(response.data.sessionId);
      setSessionActive(true);
      
      // Request camera permission
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        toast.success('Session started - Camera enabled');
      } catch (cameraError) {
        console.error('Camera error:', cameraError);
        toast.warning('Camera denied - Basic Mode activated');
        setCameraEnabled(false);
      }
      
      // Start AI monitoring loop (every 100ms)
      startAILoop();
      
      // Start 30-second score window
      startScoreWindow();
      
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    } finally {
      setLoading(false);
    }
  };

  const startAILoop = () => {
    aiIntervalRef.current = setInterval(() => {
      if (cameraEnabled && canvasRef.current && videoRef.current) {
        // Capture frame at 96x96 pixels
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx && videoRef.current) {
          canvas.width = 96;
          canvas.height = 96;
          ctx.drawImage(videoRef.current, 0, 0, 96, 96);
          
          // Convert to JPEG bytes (in real implementation, send to Python Flask)
          const imageData = canvas.toDataURL('image/jpeg', 0.8);
          
          // Simulate AI response (replace with actual API call)
          const aiResponse = {
            emotion: ['Happy', 'Focused', 'Neutral', 'Curious', 'Engaged'][Math.floor(Math.random() * 5)],
            confidence: Math.random() * 0.3 + 0.7,
            attention: Math.floor(Math.random() * 30 + 70),
            yaw: Math.random() * 30 - 15,
            pitch: Math.random() * 20 - 10,
          };
          
          setEmotion(aiResponse.emotion);
          setAttention(aiResponse.attention);
          
          // Store in frame buffer
          frameBufferRef.current.push(aiResponse);
        }
      }
    }, 100);
  };

  const startScoreWindow = () => {
    scoreIntervalRef.current = setInterval(() => {
      if (frameBufferRef.current.length > 0) {
        // Calculate composite engagement score from buffer
        const avgAttention = frameBufferRef.current.reduce((sum, f) => sum + f.attention, 0) / frameBufferRef.current.length;
        const avgConfidence = frameBufferRef.current.reduce((sum, f) => sum + f.confidence, 0) / frameBufferRef.current.length;
        const score = Math.round((avgAttention * 0.7 + avgConfidence * 100 * 0.3));
        
        setEngagementScore(score);
        setState(getStateLabel(score));
        
        // Send to backend
        if (sessionId) {
          sessionAPI.sendWindow(sessionId, {
            score,
            state: getStateLabel(score),
            dominantEmotion: emotion,
            attentionScore: avgAttention,
            emotionValence: avgConfidence,
            interactionScore: 0,
          }).catch(() => {});
        }
        
        // Check adaptive responses
        checkAdaptiveResponses(score);
        
        // Clear buffer
        frameBufferRef.current = [];
      }
    }, 30000);
  };

  const checkAdaptiveResponses = (score: number) => {
    // Response 1 - NUDGE (45-69)
    if (score >= 45 && score < 69 && !showNudge) {
      setShowNudge(true);
      setTimeout(() => setShowNudge(false), 10000);
    }
    
    // Response 2 - ALERT (20-44)
    if (score >= 20 && score < 45 && !showAlert) {
      setShowAlert(true);
    }
    
    // Response 3 - PAUSE (second time)
    if (score >= 20 && score < 45 && showAlert && !showPause) {
      setShowPause(true);
      setVideoPlaying(false);
    }
    
    // Response 4 - SUPPORT (negative affect)
    if (['Sad', 'Angry', 'Fearful'].includes(emotion) && !showSupport) {
      setShowSupport(true);
    }
    
    // Response 5 - BREAK (<20 or >25 minutes)
    if (score < 20 && !showBreak) {
      setShowBreak(true);
      setBreakCountdown(300);
      startBreakCountdown();
    }
  };

  const startBreakCountdown = () => {
    breakIntervalRef.current = setInterval(() => {
      setBreakCountdown(prev => {
        if (prev <= 1) {
          clearInterval(breakIntervalRef.current!);
          setShowBreak(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const endSession = async () => {
    setLoading(true);
    try {
      // Stop webcam
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      
      // Stop intervals
      if (aiIntervalRef.current) clearInterval(aiIntervalRef.current);
      if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
      if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
      
      // End session on backend
      if (sessionId) {
        await sessionAPI.end(sessionId);
      }
      
      toast.success('Session completed');
      router.push(`/student/reports/${sessionId}`);
      
    } catch (error) {
      toast.error('Failed to end session');
    } finally {
      setLoading(false);
    }
  };

  const toggleCamera = async () => {
    if (cameraEnabled) {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }
      setCameraEnabled(false);
      toast.warning('Camera disabled - Monitoring paused');
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setCameraEnabled(true);
        toast.success('Camera enabled');
      } catch (error) {
        toast.error('Failed to enable camera');
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatBreakTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!sessionActive) {
    return (
      <div className="min-h-screen bg-background pb-20 lg:pb-0">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8">
            <div className="flex min-h-[60vh] items-center justify-center">
              <div className="glass-card p-12 text-center">
                <h1 className="mb-4 text-2xl font-extrabold text-heading">Ready to Start Learning?</h1>
                <p className="mb-8 text-body">
                  Enable AI-powered monitoring to track your engagement and emotions during learning.
                </p>
                <button
                  onClick={startSession}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-lg font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="sm" /> : <Play className="h-6 w-6" />}
                  Start Session
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-0">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-4 md:p-8">
          {/* Session Header */}
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-bold text-heading">Course Content</h1>
              <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1">
                <span className="text-sm font-semibold text-primary">Score: {engagementScore}</span>
                <Eye className="h-4 w-4 text-primary" />
              </div>
            </div>
          </div>

          {/* Video Player Area */}
          <div className="relative mb-4 aspect-video rounded-xl bg-black">
            <video
              ref={videoRef}
              className="h-full w-full object-contain"
              autoPlay={videoPlaying}
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Engagement Overlay */}
            <div className="absolute right-4 top-4 rounded-full bg-background/90 p-4 backdrop-blur-sm">
              <div className="relative h-20 w-20">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-muted"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="transition-all duration-500"
                    d={`M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831`}
                    fill="none"
                    stroke={getScoreColor(engagementScore)}
                    strokeWidth="3"
                    strokeDasharray={`${engagementScore}, 100`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-heading">{engagementScore}</span>
                </div>
              </div>
              <p className="mt-2 text-center text-xs font-semibold text-heading">{state}</p>
              <div className="mt-1 flex items-center justify-center gap-1">
                <span className="text-xl">{emotionEmojis[emotion] || '😐'}</span>
                <Eye className={`h-4 w-4 ${attention > 70 ? 'text-success' : 'text-muted'}`} />
              </div>
            </div>

            {/* Nudge Response */}
            {showNudge && (
              <div className="absolute right-4 top-1/2 h-4 w-4 animate-pulse rounded-full bg-teal-500" />
            )}

            {/* Pause Overlay */}
            {showPause && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                <div className="glass-card p-8 text-center">
                  <Pause className="mx-auto mb-4 h-12 w-12 text-primary" />
                  <h3 className="mb-2 text-xl font-bold text-heading">Video Paused</h3>
                  <p className="mb-6 text-body">Take a moment, then continue when you are ready.</p>
                  <button
                    onClick={() => {
                      setShowPause(false);
                      setVideoPlaying(true);
                    }}
                    className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Resume
                  </button>
                </div>
              </div>
            )}

            {/* Break Overlay */}
            {showBreak && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/90">
                <div className="glass-card p-12 text-center">
                  <h3 className="mb-4 text-3xl font-bold text-heading">☕ Time for a break</h3>
                  <p className="mb-6 text-body">
                    You have been studying for a while. Rest helps you retain information better.
                  </p>
                  <p className="mb-8 text-4xl font-mono font-bold text-primary">{formatBreakTime(breakCountdown)}</p>
                  <div className="flex justify-center gap-4">
                    <button
                      onClick={() => {
                        setShowBreak(false);
                        if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
                      }}
                      className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                    >
                      Take a break
                    </button>
                    <button
                      onClick={() => {
                        setShowBreak(false);
                        if (breakIntervalRef.current) clearInterval(breakIntervalRef.current);
                      }}
                      className="rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-heading hover:bg-white/10"
                    >
                      Skip break
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Preview */}
          <div className="mb-4 flex items-center gap-4">
            <div className="relative h-24 w-32 overflow-hidden rounded-lg bg-muted">
              {cameraEnabled && videoRef.current?.srcObject ? (
                <video
                  ref={videoRef}
                  className="h-full w-full object-cover"
                  autoPlay
                  muted
                />
              ) : (
                <div className="flex h-full items-center justify-center text-body">
                  <Camera className="h-8 w-8" />
                </div>
              )}
              <div className={`absolute right-2 top-2 h-2 w-2 rounded-full ${cameraEnabled ? 'bg-success' : 'bg-muted'}`} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-heading">
                {cameraEnabled ? 'Monitoring Active' : 'Monitoring Paused'}
              </p>
              <p className="text-xs text-body">
                {cameraEnabled ? 'Camera is on - AI monitoring enabled' : 'Camera is off - Basic mode'}
              </p>
            </div>
          </div>

          {/* Control Bar */}
          <div className="glass-card mb-4 flex items-center gap-4 p-4">
            <button
              onClick={() => setVideoPlaying(!videoPlaying)}
              className="rounded-lg bg-primary p-2 text-white hover:bg-primary/90"
            >
              {videoPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 10))}
              className="rounded-lg p-2 text-heading hover:bg-white/10"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={() => setCurrentTime(Math.min(duration, currentTime + 10))}
              className="rounded-lg p-2 text-heading hover:bg-white/10"
            >
              <SkipForward className="h-5 w-5" />
            </button>
            <div className="flex-1">
              <input
                type="range"
                min="0"
                max={duration}
                value={currentTime}
                onChange={(e) => setCurrentTime(parseInt(e.target.value))}
                className="h-2 w-full cursor-pointer appearance-none rounded-full bg-muted"
              />
            </div>
            <span className="text-sm font-mono text-heading">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
            <button
              onClick={toggleCamera}
              className={`rounded-lg p-2 ${cameraEnabled ? 'bg-primary text-white' : 'bg-muted text-heading'} hover:opacity-90`}
            >
              <Camera className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className="rounded-lg bg-muted p-2 text-heading hover:bg-white/10"
            >
              <BarChart3 className="h-5 w-5" />
            </button>
            <button
              onClick={endSession}
              disabled={loading}
              className="rounded-lg bg-danger p-2 text-white hover:bg-danger/90 disabled:opacity-50"
            >
              {loading ? <LoadingSpinner size="sm" /> : <X className="h-5 w-5" />}
            </button>
          </div>

          {/* Alert Toast */}
          {showAlert && (
            <div className="fixed right-4 top-4 glass-card border border-warning/30 bg-warning/10 p-4">
              <div className="flex items-center gap-3">
                <Eye className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-semibold text-heading">You seem distracted</p>
                  <p className="text-sm text-body">Ready to continue?</p>
                </div>
                <button
                  onClick={() => setShowAlert(false)}
                  className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  I am ready ✓
                </button>
              </div>
            </div>
          )}

          {/* Support Card */}
          {showSupport && (
            <div className="fixed right-4 top-20 glass-card border border-primary/30 bg-primary/10 p-4">
              <p className="mb-2 font-semibold text-heading">This seems challenging</p>
              <p className="mb-4 text-sm text-body">Would you like to replay this section?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setCurrentTime(Math.max(0, currentTime - 120));
                    setShowSupport(false);
                  }}
                  className="rounded-lg bg-primary px-3 py-1 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Replay
                </button>
                <button
                  onClick={() => setShowSupport(false)}
                  className="rounded-lg border border-white/20 px-3 py-1 text-sm font-semibold text-heading hover:bg-white/10"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Analytics Panel */}
          {showAnalytics && (
            <div className="fixed right-0 top-0 h-full w-80 glass-card border-l border-white/20 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="font-bold text-heading">Live Analytics</h3>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="rounded-lg p-2 text-heading hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-body">Engagement Score</p>
                  <p className="text-2xl font-bold text-heading">{engagementScore}%</p>
                </div>
                <div>
                  <p className="text-sm text-body">Current State</p>
                  <p className="text-lg font-semibold text-heading">{state}</p>
                </div>
                <div>
                  <p className="text-sm text-body">Emotion</p>
                  <p className="text-lg font-semibold text-heading">{emotion}</p>
                </div>
                <div>
                  <p className="text-sm text-body">Attention</p>
                  <p className="text-lg font-semibold text-heading">{attention}%</p>
                </div>
                <div>
                  <p className="text-sm text-body">Session Time</p>
                  <p className="text-lg font-semibold text-heading">{formatTime(currentTime)}</p>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <ProtectedRoute role="student">
      <LearningSessionContent />
    </ProtectedRoute>
  );
}
