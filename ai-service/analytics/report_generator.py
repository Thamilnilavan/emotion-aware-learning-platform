"""
Report generation for session analytics
"""

import json
from typing import List, Dict, Optional
from datetime import datetime
from .emotion_stats import get_emotion_stats
from .focus_stats import get_focus_stats
from ..engagement.scorer import get_engagement_scorer
from ..engagement.state_classifier import get_state_classifier
from ..engagement.intervention_rules import get_intervention_engine


class ReportGenerator:
    """Generate comprehensive session reports"""
    
    def __init__(self):
        """Initialize report generator"""
        self.emotion_stats = get_emotion_stats()
        self.focus_stats = get_focus_stats()
        self.engagement_scorer = get_engagement_scorer()
        self.state_classifier = get_state_classifier()
        self.intervention_engine = get_intervention_engine()
    
    def generate_session_report(self, emotion_history: List[dict], attention_history: List[dict], session_duration: int) -> Dict:
        """
        Generate comprehensive session report.
        
        Args:
            emotion_history: List of emotion detection results
            attention_history: List of attention analysis results
            session_duration: Session duration in seconds
            
        Returns:
            Session report
        """
        # Calculate emotion metrics
        emotion_metrics = self.emotion_stats.calculate_emotion_metrics(emotion_history)
        
        # Calculate focus metrics
        focus_metrics = self.focus_stats.calculate_focus_score(attention_history)
        focus_periods = self.focus_stats.calculate_focus_periods(attention_history)
        distraction_events = self.focus_stats.calculate_distraction_events(attention_history)
        
        # Calculate engagement metrics
        engagement_metrics = self.engagement_scorer.calculate_engagement_from_history(
            emotion_history, attention_history
        )
        
        # Get intervention stats
        intervention_stats = self.intervention_engine.get_intervention_stats()
        
        # Generate insights
        insights = self.generate_insights(emotion_metrics, focus_metrics, engagement_metrics, distraction_events)
        
        # Compile report
        report = {
            'sessionId': None,  # To be filled by backend
            'timestamp': datetime.now().isoformat(),
            'duration': session_duration,
            'totalFrames': len(emotion_history),
            'emotionMetrics': emotion_metrics,
            'focusMetrics': focus_metrics,
            'engagementMetrics': engagement_metrics,
            'focusPeriods': focus_periods,
            'distractionEvents': distraction_events,
            'interventionStats': intervention_stats,
            'insights': insights
        }
        
        return report
    
    def generate_insights(self, emotion_metrics: Dict, focus_metrics: Dict, engagement_metrics: Dict, distraction_events: List[Dict]) -> List[str]:
        """
        Generate AI insights from metrics.
        
        Args:
            emotion_metrics: Emotion analysis results
            focus_metrics: Focus analysis results
            engagement_metrics: Engagement analysis results
            distraction_events: List of distraction events
            
        Returns:
            List of insight strings
        """
        insights = []
        
        # Engagement insights
        if engagement_metrics['averageEngagement'] >= 80:
            insights.append("Excellent engagement maintained throughout the session!")
        elif engagement_metrics['averageEngagement'] >= 60:
            insights.append("Good engagement with room for improvement.")
        else:
            insights.append("Engagement was below average. Consider shorter sessions.")
        
        # Focus insights
        if focus_metrics['focusPercentage'] >= 80:
            insights.append("Strong focus maintained with minimal distractions.")
        elif focus_metrics['focusPercentage'] >= 60:
            insights.append("Moderate focus with some distraction periods.")
        else:
            insights.append("Focus was frequently interrupted. Try eliminating distractions.")
        
        # Emotion insights
        dominant = emotion_metrics['dominantEmotion']
        if dominant['dominantEmotion'] in ['Happy', 'Surprise']:
            insights.append(f"Positive emotional state ({dominant['dominantEmotion']}) dominated the session.")
        elif dominant['dominantEmotion'] in config.NEGATIVE_EMOTIONS:
            insights.append(f"Negative emotion ({dominant['dominantEmotion']}) detected. Consider support.")
        else:
            insights.append(f"Neutral emotional state maintained throughout session.")
        
        # Trend insights
        if engagement_metrics['engagementTrend'] == 'improving':
            insights.append("Engagement improved over time - great momentum!")
        elif engagement_metrics['engagementTrend'] == 'declining':
            insights.append("Engagement declined towards the end. Consider breaks.")
        
        # Distraction insights
        if len(distraction_events) > 5:
            insights.append(f"Multiple distraction events ({len(distraction_events)}) detected.")
        elif len(distraction_events) > 0:
            insights.append(f"Some distraction events ({len(distraction_events)}) occurred.")
        
        return insights
    
    def generate_summary_statistics(self, emotion_history: List[dict], attention_history: List[dict]) -> Dict:
        """
        Generate summary statistics for session end.
        
        Args:
            emotion_history: List of emotion detection results
            attention_history: List of attention analysis results
            
        Returns:
            Summary statistics
        """
        emotion_metrics = self.emotion_stats.calculate_emotion_metrics(emotion_history)
        focus_metrics = self.focus_stats.calculate_focus_score(attention_history)
        engagement_metrics = self.engagement_scorer.calculate_engagement_from_history(
            emotion_history, attention_history
        )
        
        return {
            'averageScore': engagement_metrics['averageEngagement'],
            'highestScore': engagement_metrics['highestEngagement'],
            'lowestScore': engagement_metrics['lowestEngagement'],
            'focusPercentage': focus_metrics['focusPercentage'],
            'dominantEmotion': emotion_metrics['dominantEmotion']['dominantEmotion'],
            'emotionStability': emotion_metrics['stability'],
            'totalDistractions': len(self.focus_stats.calculate_distraction_events(attention_history)),
            'totalInterventions': self.intervention_engine.get_intervention_stats()['totalInterventions']
        }
    
    def export_report(self, report: Dict, format: str = 'json') -> str:
        """
        Export report in specified format.
        
        Args:
            report: Report dictionary
            format: Export format ('json')
            
        Returns:
            Exported report string
        """
        if format == 'json':
            return json.dumps(report, indent=2)
        else:
            raise ValueError(f"Unsupported format: {format}")


# Global generator instance
_generator = None


def get_report_generator() -> ReportGenerator:
    """Get or create global report generator"""
    global _generator
    if _generator is None:
        _generator = ReportGenerator()
    return _generator
