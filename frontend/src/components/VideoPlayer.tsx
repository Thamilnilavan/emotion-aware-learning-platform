'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';

// YouTube API type declarations
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  url: string;
  contentType: 'youtube' | 'video';
  onEnded?: () => void;
  onPause?: () => void;
  onPlay?: () => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  externalPaused?: boolean;
  className?: string;
}

// Get full URL for local videos
const getFullVideoUrl = (url: string) => {
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  // Prepend backend URL for local video files
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001/api';
  return `${apiUrl.replace(/\/api\/?$/, '')}${url}`;
};

export function VideoPlayer({
  url,
  contentType,
  onEnded,
  onPause,
  onPlay,
  onTimeUpdate,
  externalPaused = false,
  className = ''
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showSettings, setShowSettings] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerRef = useRef<HTMLDivElement>(null);
  const youtubePlayerInstance = useRef<any>(null);

  // Extract YouTube video ID
  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = contentType === 'youtube' ? getYouTubeId(url) : null;
  const fullVideoUrl = contentType === 'video' ? getFullVideoUrl(url) : url;

  // Load YouTube IFrame API
  useEffect(() => {
    if (contentType !== 'youtube' || !youtubeId) return;

    const loadYouTubeAPI = () => {
      if (window.YT) {
        initializeYouTubePlayer();
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = initializeYouTubePlayer;
    };

    const initializeYouTubePlayer = () => {
      if (youtubePlayerInstance.current || !youtubePlayerRef.current) return;

      const player = new window.YT.Player(youtubePlayerRef.current, {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          modestbranding: 1,
          rel: 0
        },
        events: {
          onReady: (event: any) => {
            youtubePlayerInstance.current = event.target;
            setDuration(event.target.getDuration());
          },
          onStateChange: (event: any) => {
            if (event.data === window.YT.PlayerState.PLAYING) {
              setIsPlaying(true);
              onPlay?.();
            } else if (event.data === window.YT.PlayerState.PAUSED) {
              setIsPlaying(false);
              onPause?.();
            } else if (event.data === window.YT.PlayerState.ENDED) {
              setIsPlaying(false);
              onEnded?.();
            }
          }
        }
      });
    };

    loadYouTubeAPI();

    return () => {
      if (window.YT && youtubePlayerInstance.current) {
        youtubePlayerInstance.current.destroy();
        youtubePlayerInstance.current = null;
      }
    };
  }, [contentType, youtubeId, onPlay, onPause, onEnded]);

  // Handle external pause
  useEffect(() => {
    if (externalPaused && isPlaying) {
      if (contentType === 'video' && videoRef.current) {
        videoRef.current.pause();
      } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
        youtubePlayerInstance.current.pauseVideo();
      }
    }
  }, [externalPaused, isPlaying, contentType]);

  // Video event listeners for native video
  useEffect(() => {
    if (contentType !== 'video' || !videoRef.current) return;

    const video = videoRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onTimeUpdate?.(video.currentTime, video.duration);
    };

    const handleLoadedMetadata = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [contentType, onPlay, onPause, onEnded, onTimeUpdate]);

  // YouTube time tracking
  useEffect(() => {
    if (contentType !== 'youtube' || !youtubePlayerInstance.current) return;

    const timeInterval = setInterval(() => {
      if (youtubePlayerInstance.current && youtubePlayerInstance.current.getCurrentTime) {
        const time = youtubePlayerInstance.current.getCurrentTime();
        setCurrentTime(time);
        onTimeUpdate?.(time, duration);
      }
    }, 1000);

    return () => clearInterval(timeInterval);
  }, [contentType, duration, onTimeUpdate]);

  const togglePlayPause = useCallback(() => {
    if (contentType === 'video' && videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      if (isPlaying) {
        youtubePlayerInstance.current.pauseVideo();
      } else {
        youtubePlayerInstance.current.playVideo();
      }
    }
  }, [contentType, isPlaying]);

  const toggleMute = useCallback(() => {
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      if (isMuted) {
        youtubePlayerInstance.current.unMute();
      } else {
        youtubePlayerInstance.current.mute();
      }
      setIsMuted(!isMuted);
    }
  }, [contentType, isMuted]);

  const changeSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    setShowSettings(false);
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.playbackRate = speed;
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      youtubePlayerInstance.current.setPlaybackRate(speed);
    }
  }, [contentType]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  const skipBack = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      youtubePlayerInstance.current.seekTo(newTime);
    }
    setCurrentTime(newTime);
  }, [contentType, currentTime]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.currentTime = newTime;
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      youtubePlayerInstance.current.seekTo(newTime);
    }
    setCurrentTime(newTime);
  }, [contentType, currentTime, duration]);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.currentTime = time;
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      youtubePlayerInstance.current.seekTo(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (contentType === 'video' && videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
      youtubePlayerInstance.current.setVolume(vol * 100);
      if (vol === 0) {
        youtubePlayerInstance.current.mute();
      } else {
        youtubePlayerInstance.current.unMute();
      }
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      switch (e.key) {
        case ' ':
        case 'k':
        case 'K':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          skipBack();
          break;
        case 'ArrowRight':
          e.preventDefault();
          skipForward();
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          toggleFullscreen();
          break;
        case '0':
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
        case '7':
        case '8':
        case '9':
          e.preventDefault();
          const percent = parseInt(e.key) * 10;
          const time = (duration * percent) / 100;
          setCurrentTime(time);
          if (contentType === 'video' && videoRef.current) {
            videoRef.current.currentTime = time;
          } else if (contentType === 'youtube' && youtubePlayerInstance.current) {
            youtubePlayerInstance.current.seekTo(time);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [togglePlayPause, skipBack, skipForward, toggleMute, toggleFullscreen, duration, contentType]);

  return (
    <div ref={containerRef} className={`relative bg-black rounded-lg overflow-hidden ${className}`}>
      {/* Video Container */}
      <div className="relative aspect-video">
        {contentType === 'youtube' && youtubeId ? (
          <div ref={youtubePlayerRef} className="w-full h-full" />
        ) : contentType === 'video' && fullVideoUrl ? (
          <video
            ref={videoRef}
            src={fullVideoUrl}
            className="w-full h-full object-contain"
            controls={false}
          />
        ) : (
          <div className="flex items-center justify-center h-full w-full bg-gray-900 text-white">
            <p className="text-lg">No video available</p>
          </div>
        )}
      </div>

      {/* Controls Overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        {/* Progress Bar */}
        <div className="mb-3">
          <input
            type="range"
            min="0"
            max={duration}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlayPause}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </button>

            <button
              onClick={skipBack}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <SkipBack className="h-5 w-5" />
            </button>

            <button
              onClick={skipForward}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <SkipForward className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
              />
            </div>

            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
              >
                <span className="text-sm font-semibold">{playbackSpeed}x</span>
              </button>

              {showSettings && (
                <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 space-y-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => changeSpeed(speed)}
                      className={`block w-full px-3 py-1 text-sm text-white rounded hover:bg-white/20 ${
                        playbackSpeed === speed ? 'bg-white/30' : ''
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors"
            >
              <Maximize className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
