"""
Engagement score calculation combining emotion and attention
"""

import numpy as np
from typing import List, Dict
import config


class EngagementScorer:
    """Engagement score calculation"""
    
    def __init__(self):
        """Initialize engagement scorer"""
        self.weights = config.ENGAGEMENT_WEIGHTS
    
    def calculate_emotion_score(self, emotion: str, confidence: float, emotion_probs: dict) -> float:
        """
        Calculate emotion engagement score.
        
        Args:
            emotion: Detected emotion
            confidence: Emotion confidence
            emotion_probs: All emotion probabilities
            
        Returns:
            Emotion score [0, 1]
        """
        # Positive emotions get higher scores
        positive_emotions = ['Happy', 'Surprise']
        neutral_emotions = ['Neutral']
        negative_emotions = config.NEGATIVE_EMOTIONS
        
        if emotion in positive_emotions:
            base_score = 0.9
        elif emotion in neutral_emotions:
            base_score = 0.7
        else:
            base_score = 0.4
        
        # Adjust by confidence
        emotion_score = base_score * confidence
        
        return emotion_score
    
    def calculate_engagement_score(self, emotion_data: dict, attention_data: dict, interaction_score: float = 0.5) -> dict:
        """
        Calculate weighted engagement score.
        
        Args:
            emotion_data: Emotion detection results
            attention_data: Attention analysis results
            interaction_score: Interaction score [0, 1]
            
        Returns:
            Engagement score results
        """
        # Calculate emotion score
        emotion_score = self.calculate_emotion_score(
            emotion_data['emotion'],
            emotion_data['confidence'],
            emotion_data.get('emotionProbabilities', {})
        )
        
        # Get attention score
        attention_score = attention_data['attention'] / 100.0
        
        # Weighted combination
        engagement_score = (
            self.weights['emotion'] * emotion_score +
            self.weights['attention'] * attention_score +
            self.weights['interaction'] * interaction_score
        )
        
        # Convert to percentage
        engagement_percent = int(engagement_score * 100)
        
        return {
            'engagementScore': engagement_percent,
            'emotionScore': int(emotion_score * 100),
            'attentionScore': attention_data['attention'],
            'interactionScore': int(interaction_score * 100)
        }
    
    def calculate_engagement_from_history(self, emotion_history: List[dict], attention_history: List[dict]) -> dict:
        """
        Calculate engagement metrics from frame history.
        
        Args:
            emotion_history: List of emotion detection results
            attention_history: List of attention analysis results
            
        Returns:
            Aggregated engagement metrics
        """
        if not emotion_history or not attention_history:
            return {
                'averageEngagement': 0,
                'highestEngagement': 0,
                'lowestEngagement': 0,
                'engagementTrend': 'stable'
            }
        
        # Calculate engagement for each frame
        engagement_scores = []
        for emo, att in zip(emotion_history, attention_history):
            result = self.calculate_engagement_score(emo, att)
            engagement_scores.append(result['engagementScore'])
        
        # Calculate metrics
        avg_engagement = np.mean(engagement_scores)
        highest_engagement = max(engagement_scores)
        lowest_engagement = min(engagement_scores)
        
        # Determine trend
        if len(engagement_scores) >= 10:
            recent_avg = np.mean(engagement_scores[-5:])
            earlier_avg = np.mean(engagement_scores[:-5])
            if recent_avg > earlier_avg + 5:
                trend = 'improving'
            elif recent_avg < earlier_avg - 5:
                trend = 'declining'
            else:
                trend = 'stable'
        else:
            trend = 'stable'
        
        return {
            'averageEngagement': int(avg_engagement),
            'highestEngagement': int(highest_engagement),
            'lowestEngagement': int(lowest_engagement),
            'engagementTrend': trend
        }


# Global scorer instance
_scorer = None


def get_engagement_scorer() -> EngagementScorer:
    """Get or create global engagement scorer"""
    global _scorer
    if _scorer is None:
        _scorer = EngagementScorer()
    return _scorer
