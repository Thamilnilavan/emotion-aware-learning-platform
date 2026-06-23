"""
Focus statistics calculation
"""

import numpy as np
from typing import List, Dict
import config


class FocusStats:
    """Focus statistics calculation"""
    
    def __init__(self):
        """Initialize focus stats calculator"""
        self.threshold = config.ATTENTION_THRESHOLD
    
    def calculate_focus_percentage(self, attention_history: List[dict]) -> float:
        """
        Calculate focus percentage from attention history.
        
        Args:
            attention_history: List of attention analysis results
            
        Returns:
            Focus percentage [0, 100]
        """
        if not attention_history:
            return 0.0
        
        # Count frames above threshold
        focused_frames = sum(1 for a in attention_history if a['attention'] > self.threshold * 100)
        
        # Calculate percentage
        focus_percentage = (focused_frames / len(attention_history)) * 100
        
        return focus_percentage
    
    def calculate_focus_periods(self, attention_history: List[dict]) -> List[Dict]:
        """
        Identify focused and unfocused periods.
        
        Args:
            attention_history: List of attention analysis results
            
        Returns:
            List of focus periods
        """
        if not attention_history:
            return []
        
        periods = []
        current_period = None
        threshold = self.threshold * 100
        
        for i, att in enumerate(attention_history):
            is_focused = att['attention'] > threshold
            
            if current_period is None:
                current_period = {
                    'start': i,
                    'end': i,
                    'focused': is_focused
                }
            elif current_period['focused'] == is_focused:
                current_period['end'] = i
            else:
                periods.append(current_period)
                current_period = {
                    'start': i,
                    'end': i,
                    'focused': is_focused
                }
        
        if current_period:
            periods.append(current_period)
        
        return periods
    
    def calculate_average_focus_duration(self, attention_history: List[dict]) -> Dict:
        """
        Calculate average duration of focused and unfocused periods.
        
        Args:
            attention_history: List of attention analysis results
            
        Returns:
            Average durations in frames
        """
        periods = self.calculate_focus_periods(attention_history)
        
        if not periods:
            return {
                'averageFocusedDuration': 0,
                'averageUnfocusedDuration': 0
            }
        
        focused_durations = [p['end'] - p['start'] + 1 for p in periods if p['focused']]
        unfocused_durations = [p['end'] - p['start'] + 1 for p in periods if not p['focused']]
        
        return {
            'averageFocusedDuration': np.mean(focused_durations) if focused_durations else 0,
            'averageUnfocusedDuration': np.mean(unfocused_durations) if unfocused_durations else 0
        }
    
    def calculate_focus_score(self, attention_history: List[dict]) -> Dict:
        """
        Calculate comprehensive focus score.
        
        Args:
            attention_history: List of attention analysis results
            
        Returns:
            Focus score metrics
        """
        if not attention_history:
            return {
                'focusPercentage': 0,
                'averageAttention': 0,
                'peakAttention': 0,
                'focusStability': 0
            }
        
        # Calculate metrics
        focus_percentage = self.calculate_focus_percentage(attention_history)
        average_attention = np.mean([a['attention'] for a in attention_history])
        peak_attention = max([a['attention'] for a in attention_history])
        
        # Calculate stability (standard deviation)
        attention_values = [a['attention'] for a in attention_history]
        std_dev = np.std(attention_values)
        focus_stability = max(0, 1 - (std_dev / 100))
        
        return {
            'focusPercentage': int(focus_percentage),
            'averageAttention': int(average_attention),
            'peakAttention': int(peak_attention),
            'focusStability': float(focus_stability)
        }
    
    def calculate_distraction_events(self, attention_history: List[dict]) -> List[Dict]:
        """
        Identify distraction events (sudden drops in attention).
        
        Args:
            attention_history: List of attention analysis results
            
        Returns:
            List of distraction events
        """
        if len(attention_history) < 5:
            return []
        
        events = []
        threshold = self.threshold * 100
        window_size = 5
        
        for i in range(window_size, len(attention_history)):
            # Calculate average before
            before_avg = np.mean([a['attention'] for a in attention_history[i-window_size:i]])
            current = attention_history[i]['attention']
            
            # Detect sudden drop
            if before_avg > threshold and current < threshold:
                events.append({
                    'frame': i,
                    'beforeAttention': int(before_avg),
                    'afterAttention': current,
                    'drop': int(before_avg - current)
                })
        
        return events


# Global stats instance
_stats = None


def get_focus_stats() -> FocusStats:
    """Get or create global focus stats calculator"""
    global _stats
    if _stats is None:
        _stats = FocusStats()
    return _stats
