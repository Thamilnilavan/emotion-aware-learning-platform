'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';
import { useWebcam } from '@/hooks/useWebcam';
import { useEngagement } from '@/hooks/useEngagement';
import { useAdaptive } from '@/hooks/useAdaptive';
import { useDistractionPrevention } from '@/hooks/useDistractionPrevention';
import { VideoPlayer } from '@/components/VideoPlayer';
import { sessionAPI } from '@/services/api/sessions';
import { coursesAPI } from '@/services/api/dashboard';
import type { FrameResult, Intervention } from '@/types';

interface SessionPlayerProps {
  courseId: string;
  sessionId: string;
}

type TabType = 'video' | 'notes' | 'transcript' | 'resources' | 'feedback';

export function SessionPlayer({ courseId, sessionId }: SessionPlayerProps) {
  const [course, setCourse] = useState<any>(null);
  const [sessionData, setSessionData] = useState<any>(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [contentType, setContentType] = useState<'youtube' | 'video'>('video');
  const [activeTab, setActiveTab] = useState<TabType>('video');
  const [externalPaused, setExternalPaused] = useState(false);
  const [sessionActive, setSessionActive] = useState(false);
  const [loading, setLoading] = useState(true);

  // Custom hooks
  const { videoRef, canvasRef, isCapturing, hasPermission, cameraEnabled, error, startCapture, stopCapture, toggleCamera } = useWebcam();
  const { currentScore, currentState, windowHistory, addFrame, countdown } = useEngagement(sessionId, sessionActive);
  const { currentIntervention, dismissIntervention } = useAdaptive(currentState, currentScore, 'medium');
  
  const { tabSwitchCount, isFocused, showWarning, dismissWarning, resetTabSwitchCount } = useDistractionPrevention({
    enabled: sessionActive,
    onTabSwitch: (count) => {
      if (count >= 3) {
        toast.warning('You have switched tabs multiple times. Please stay focused.');
      }
    },
    onFocusLoss: () => {
      if (sessionActive) {
        toast.info('Focus lost detected');
      }
    },
    onFocusReturn: () => {
      if (sessionActive) {
        toast.success('Welcome back to focus');
      }
    },
    maxTabSwitches: 3
  });

  // Load course data
  useEffect(() => {
    const loadCourse = async () => {
      try {
        const courseData = await coursesAPI.getById(courseId);
        setCourse(courseData.data);
        
        // Find session content - handle different API response structures
        let courseContent: any[] = [];
        
        const data: any = courseData.data;
        
        if (data?.course?.content) {
          courseContent = data.course.content;
        } else if (data?.content) {
          courseContent = data.content;
        } else if (Array.isArray(data)) {
          courseContent = data;
        }
        
        const sessionContent = courseContent.find((c: any) => c._id === sessionId) || courseContent[0];
        
        if (sessionContent) {
          setSessionData(sessionContent);
          setVideoUrl(sessionContent.url || '');
          // Use contentType field instead of type
          const contentContentType = sessionContent.contentType || sessionContent.type;
          setContentType(contentContentType === 'youtube' ? 'youtube' : 'video');
        }
      } catch (error) {
        console.error('Failed to load course:', error);
        toast.error('Failed to load course data');
        // Set loading to false even on error to prevent infinite loading state
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    loadCourse();
  }, [courseId, sessionId]);

  // Handle frame results from webcam
  const handleFrameResult = (result: FrameResult) => {
    addFrame(result);
  };

  // Start session
  const startSession = async () => {
    try {
      const response = await sessionAPI.start(courseId);
      setSessionActive(true);
      
      // Start webcam capture
      startCapture(handleFrameResult);
      
      toast.success('Session started - Camera enabled');
    } catch (error) {
      console.error('Failed to start session:', error);
      toast.error('Failed to start session');
    }
  };

  // End session
  const endSession = async () => {
    try {
      await sessionAPI.end(sessionId);
      setSessionActive(false);
      stopCapture();
      toast.success('Session ended');
    } catch (error) {
      console.error('Failed to end session:', error);
      toast.error('Failed to end session');
    }
  };

  // Handle intervention actions
  useEffect(() => {
    if (currentIntervention) {
      if (currentIntervention.pauseVideo) {
        setExternalPaused(true);
      }
      
      if (currentIntervention.message) {
        toast.info(currentIntervention.message);
      }
    } else {
      setExternalPaused(false);
    }
  }, [currentIntervention]);

  // Video event handlers
  const handleVideoPlay = () => {
    // Video started playing
  };

  const handleVideoPause = () => {
    // Video paused
  };

  const handleVideoEnded = () => {
    toast.info('Video completed');
  };

  const handleTimeUpdate = (currentTime: number, duration: number) => {
    // Track video progress
  };

  // Tab content rendering
  const renderTabContent = () => {
    switch (activeTab) {
      case 'video':
        return (
          <VideoPlayer
            url={videoUrl}
            contentType={contentType}
            onEnded={handleVideoEnded}
            onPause={handleVideoPause}
            onPlay={handleVideoPlay}
            onTimeUpdate={handleTimeUpdate}
            externalPaused={externalPaused}
            className="w-full"
          />
        );
      case 'notes':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Notes</h3>
            <textarea
              className="w-full h-96 p-4 border rounded-lg resize-none"
              placeholder="Take notes here..."
            />
          </div>
        );
      case 'transcript':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Transcript</h3>
            <p className="text-gray-600">Transcript will appear here...</p>
          </div>
        );
      case 'resources':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Resources</h3>
            <p className="text-gray-600">Additional resources will appear here...</p>
          </div>
        );
      case 'feedback':
        return (
          <div className="p-6">
            <h3 className="text-xl font-bold mb-4">Feedback</h3>
            <textarea
              className="w-full h-48 p-4 border rounded-lg resize-none mb-4"
              placeholder="Provide feedback on this session..."
            />
            <button className="px-4 py-2 bg-primary text-white rounded-lg">
              Submit Feedback
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">{course?.title || 'Course'}</h1>
              <p className="text-gray-600">{sessionData?.title || 'Session'}</p>
            </div>
            <div className="flex items-center gap-4">
              {!sessionActive ? (
                <button
                  onClick={startSession}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                >
                  Start Session
                </button>
              ) : (
                <button
                  onClick={endSession}
                  className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                >
                  End Session
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left: Video Player + Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Navigation Tabs */}
            <div className="bg-white border-b flex">
              {[
                { id: 'video', label: 'Video' },
                { id: 'notes', label: 'Notes' },
                { id: 'transcript', label: 'Transcript' },
                { id: 'resources', label: 'Resources' },
                { id: 'feedback', label: 'Feedback' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-6 py-3 font-medium transition-colors ${
                    activeTab === tab.id
                      ? 'text-primary border-b-2 border-primary'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-auto bg-gray-50">
              {renderTabContent()}
            </div>
          </div>

          {/* Right: AI Monitoring Panel (Sticky) */}
          <div className="w-80 bg-white border-l overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold mb-4">AI Monitoring</h2>

              {/* Camera Preview */}
              {sessionActive && (
                <div className="mb-4">
                  <div className="relative h-40 w-full bg-gray-200 rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      className="w-full h-full object-cover"
                      autoPlay
                      muted
                    />
                    <canvas ref={canvasRef} className="hidden" />
                  </div>
                  <button
                    onClick={toggleCamera}
                    className="mt-2 text-sm text-primary hover:underline"
                  >
                    {cameraEnabled ? 'Disable Camera' : 'Enable Camera'}
                  </button>
                </div>
              )}

              {/* Engagement Metrics */}
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Engagement Score</p>
                  <p className="text-2xl font-bold">{currentScore}%</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Current State</p>
                  <p className="text-lg font-semibold">{currentState}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Tab Switches</p>
                  <p className="text-lg font-semibold">{tabSwitchCount}</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Focus Status</p>
                  <p className="text-lg font-semibold">
                    {isFocused ? '✓ Focused' : '✗ Distracted'}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Next Score Update</p>
                  <p className="text-lg font-semibold">{countdown}s</p>
                </div>
              </div>

              {/* Intervention Display */}
              {currentIntervention && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <p className="font-semibold text-yellow-800">
                    {currentIntervention.type}
                  </p>
                  {currentIntervention.message && (
                    <p className="text-sm text-yellow-700 mt-1">
                      {currentIntervention.message}
                    </p>
                  )}
                  <button
                    onClick={dismissIntervention}
                    className="mt-2 text-sm text-yellow-800 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Tab Warning */}
              {showWarning && (
                <div className="mt-4 bg-red-50 border border-red-200 p-4 rounded-lg">
                  <p className="font-semibold text-red-800">
                    Too many tab switches!
                  </p>
                  <button
                    onClick={dismissWarning}
                    className="mt-2 text-sm text-red-800 hover:underline"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
