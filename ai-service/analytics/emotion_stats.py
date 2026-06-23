"""
Emotion statistics calculation
"""

import numpy as np
from typing import List, Dict
from collections import Counter
import config


class EmotionStats:
    """Emotion statistics calculation"""
    
    def __init__(self):
        """Initialize emotion stats calculator"""
        self.emotions = config.EMOTIONS
    
    def calculate_emotion_distribution(self, emotion_history: List[dict]) -> Dict[str, float]:
        """
        Calculate emotion distribution from history.
        
        Args:
            emotion_history: List of emotion detection results
            
        Returns:
            Dictionary with emotion percentages
        """
        if not emotion_history:
            return {emotion: 0.0 for emotion in self.emotions}
        
        # Count emotions
        emotion_counts = Counter([e['emotion'] for e in emotion_history])
        
        # Calculate percentages
        total = len(emotion_history)
        distribution = {}
        for emotion in self.emotions:
            distribution[emotion] = (emotion_counts.get(emotion, 0) / total) * 100
        
        return distribution
    
    def calculate_dominant_emotion(self, emotion_history: List[dict]) -> Dict:
        """
        Calculate dominant emotion.
        
        Args:
            emotion_history: List of emotion detection results
            
        Returns:
            Dominant emotion info
        """
        if not emotion_history:
            return {
                'dominantEmotion': 'Unknown',
                'percentage': 0.0,
                'confidence': 0.0
            }
        
        distribution = self.calculate_emotion_distribution(emotion_history)
        dominant = max(distribution.items(), key=lambda x: x[1])
        
        # Average confidence for dominant emotion
        dominant_emotion = dominant[0]
        confidences = [e['confidence'] for e in emotion_history if e['emotion'] == dominant_emotion]
        avg_confidence = np.mean(confidences) if confidences else 0
        
        return {
            'dominantEmotion': dominant_emotion,
            'percentage': dominant[1],
            'confidence': avg_confidence
        }
    
    def calculate_emotion_stability(self, emotion_history: List[dict]) -> float:
        """
        Calculate emotion stability (how consistent emotions are).
        
        Args:
            emotion_history: List of emotion detection results
            
        Returns:
            Stability score [0, 1]
        """
        if len(emotion_history) < 2:
            return 1.0
        
        # Count transitions
        transitions = 0
        for i in range(1, len(emotion_history)):
            if emotion_history[i]['emotion'] != emotion_history[i-1]['emotion']:
                transitions += 1
        
        # Stability = 1 - (transitions / total possible transitions)
        stability = 1 - (transitions / (len(emotion_history) - 1))
        
        return stability
    
    def calculate_emotion_trend(self, emotion_history: List[dict]) -> str:
        """
        Calculate emotion trend over time.
        
        Args:
            emotion_history: List of emotion detection results
            
        Returns:
            Trend: 'improving', 'declining', 'stable'
        """
        if len(emotion_history) < 10:
            return 'stable'
        
        # Split into recent and earlier
        midpoint = len(emotion_history) // 2
        recent = emotion_history[midpoint:]
        earlier = emotion_history[:midpoint]
        
        # Calculate positive emotion percentage
        positive_emotions = ['Happy', 'Surprise']
        
        recent_positive = sum(1 for e in recent if e['emotion'] in positive_emotions) / len(recent)
        earlier_positive = sum(1 for e in earlier if e['emotion'] in positive_emotions) / len(earlier)
        
        if recent_positive > earlier_positive + 0.1:
            return 'improving'
        elif recent_positive < earlier_positive - 0.1:
            return 'declining'
        else:
            return 'stable'
    
    def calculate_emotion_metrics(self, emotion_history: List[dict]) -> Dict:
        """
        Calculate comprehensive emotion metrics.
        
        Args:
            emotion_history: List of emotion detection results
            
        Returns:
            Comprehensive emotion metrics
        """
        return {
            'distribution': self.calculate_emotion_distribution(emotion_history),
            'dominantEmotion': self.calculate_dominant_emotion(emotion_history),
            'stability': self.calculate_emotion_stability(emotion_history),
            'trend': self.calculate_emotion_trend(emotion_history),
            'totalFrames': len(emotion_history)
        }


# Global stats instance
_stats = None


def get_emotion_stats() -> EmotionStats:
    """Get or create global emotion stats calculator"""
    global _stats
    if _stats is None:
        _stats = EmotionStats()
    return _stats
