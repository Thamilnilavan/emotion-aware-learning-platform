'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface DistractionPreventionOptions {
  enabled: boolean;
  onTabSwitch?: (count: number) => void;
  onFocusLoss?: () => void;
  onFocusReturn?: () => void;
  maxTabSwitches?: number;
}

export function useDistractionPrevention(options: DistractionPreventionOptions) {
  const {
    enabled,
    onTabSwitch,
    onFocusLoss,
    onFocusReturn,
    maxTabSwitches = 3
  } = options;

  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [isFocused, setIsFocused] = useState(true);
  const [showWarning, setShowWarning] = useState(false);
  const lastFocusTime = useRef(Date.now());

  // Tab switching detection
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab switched away
        setTabSwitchCount(prev => {
          const newCount = prev + 1;
          if (onTabSwitch) {
            onTabSwitch(newCount);
          }
          if (newCount >= maxTabSwitches) {
            setShowWarning(true);
          }
          return newCount;
        });
        if (onFocusLoss) {
          onFocusLoss();
        }
        setIsFocused(false);
      } else {
        // Tab returned
        lastFocusTime.current = Date.now();
        setIsFocused(true);
        if (onFocusReturn) {
          onFocusReturn();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [enabled, maxTabSwitches, onTabSwitch, onFocusLoss, onFocusReturn]);

  // Window blur/focus detection
  useEffect(() => {
    if (!enabled) return;

    const handleBlur = () => {
      setIsFocused(false);
      if (onFocusLoss) {
        onFocusLoss();
      }
    };

    const handleFocus = () => {
      const timeAway = Date.now() - lastFocusTime.current;
      lastFocusTime.current = Date.now();
      setIsFocused(true);
      if (onFocusReturn) {
        onFocusReturn();
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, onFocusLoss, onFocusReturn]);

  // Mouse leave detection (blur detection)
  useEffect(() => {
    if (!enabled) return;

    const handleMouseLeave = () => {
      if (onFocusLoss) {
        onFocusLoss();
      }
    };

    const handleMouseEnter = () => {
      if (onFocusReturn) {
        onFocusReturn();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [enabled, onFocusLoss, onFocusReturn]);

  const dismissWarning = useCallback(() => {
    setShowWarning(false);
  }, []);

  const resetTabSwitchCount = useCallback(() => {
    setTabSwitchCount(0);
    setShowWarning(false);
  }, []);

  return {
    tabSwitchCount,
    isFocused,
    showWarning,
    dismissWarning,
    resetTabSwitchCount
  };
}
