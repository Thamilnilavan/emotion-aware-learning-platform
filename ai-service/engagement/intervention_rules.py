"""
Adaptive intervention engine based on engagement state
"""

import config
from .state_classifier import get_state_classifier


class InterventionEngine:
    """Adaptive intervention engine"""
    
    def __init__(self):
        """Initialize intervention engine"""
        self.state_classifier = get_state_classifier()
        self.intervention_history = []
        self.distraction_count = 0
        self.last_intervention_time = None
        self.session_start_time = None
    
    def determine_intervention(self, state: str, engagement_score: int, emotion: str = None, session_duration: int = 0) -> dict:
        """
        Determine appropriate intervention based on state.
        
        Args:
            state: Current learning state
            engagement_score: Engagement score
            emotion: Current emotion
            session_duration: Session duration in seconds
            
        Returns:
            Intervention recommendation
        """
        intervention = {
            'type': None,
            'message': '',
            'priority': 'low',
            'actionRequired': False
        }
        
        # Check for negative emotions (SUPPORT)
        if emotion and emotion in config.NEGATIVE_EMOTIONS:
            intervention['type'] = 'SUPPORT'
            intervention['message'] = 'This seems challenging. Would you like to replay this section?'
            intervention['priority'] = 'medium'
            intervention['actionRequired'] = True
            return intervention
        
        # Check for break needed
        if state == 'BREAK_NEEDED' or session_duration > config.LONG_SESSION_THRESHOLD_MINUTES * 60:
            intervention['type'] = 'BREAK'
            intervention['message'] = 'You have been studying for a while. Time for a break!'
            intervention['priority'] = 'high'
            intervention['actionRequired'] = True
            return intervention
        
        # Check for distraction
        if state == 'DISTRACTED':
            self.distraction_count += 1
            
            if self.distraction_count >= 2:
                # Second distraction - PAUSE
                intervention['type'] = 'PAUSE'
                intervention['message'] = 'Video paused. Take a moment to refocus.'
                intervention['priority'] = 'high'
                intervention['actionRequired'] = True
            else:
                # First distraction - ALERT
                intervention['type'] = 'ALERT'
                intervention['message'] = 'You seem distracted. Ready to continue?'
                intervention['priority'] = 'medium'
                intervention['actionRequired'] = True
            return intervention
        
        # Mild distraction - NUDGE
        if state == 'MILD_DISTRACTION':
            intervention['type'] = 'NUDGE'
            intervention['message'] = 'Stay focused!'
            intervention['priority'] = 'low'
            intervention['actionRequired'] = False
            return intervention
        
        # Engaged - no intervention needed
        self.distraction_count = 0
        return intervention
    
    def get_intervention_details(self, intervention_type: str) -> dict:
        """
        Get detailed information about intervention type.
        
        Args:
            intervention_type: Type of intervention
            
        Returns:
            Intervention details
        """
        details = {
            'NUDGE': {
                'type': 'NUDGE',
                'description': 'Small visual reminder to stay focused',
                'duration': 10,  # seconds
                'uiElement': 'pulsing_dot',
                'color': '#14B8A6',  # Teal
                'autoDismiss': True
            },
            'ALERT': {
                'type': 'ALERT',
                'description': 'Toast notification for distraction',
                'duration': 0,  # Requires user action
                'uiElement': 'toast',
                'color': '#F59E0B',  # Amber
                'autoDismiss': False
            },
            'PAUSE': {
                'type': 'PAUSE',
                'description': 'Auto-pause video with overlay',
                'duration': 0,  # Requires user action
                'uiElement': 'overlay',
                'color': '#EF4444',  # Red
                'autoDismiss': False
            },
            'SUPPORT': {
                'type': 'SUPPORT',
                'description': 'Replay card for negative emotions',
                'duration': 0,  # Requires user action
                'uiElement': 'slide_in_card',
                'color': '#8B5CF6',  # Purple
                'autoDismiss': False
            },
            'BREAK': {
                'type': 'BREAK',
                'description': 'Full-screen overlay with countdown',
                'duration': config.BREAK_DURATION_SECONDS,
                'uiElement': 'fullscreen_overlay',
                'color': '#6366F1',  # Indigo
                'autoDismiss': False
            }
        }
        
        return details.get(intervention_type, {})
    
    def record_intervention(self, intervention: dict):
        """
        Record intervention in history.
        
        Args:
            intervention: Intervention data
        """
        from datetime import datetime
        self.intervention_history.append({
            'type': intervention['type'],
            'message': intervention['message'],
            'timestamp': datetime.now().isoformat()
        })
    
    def get_intervention_stats(self) -> dict:
        """
        Get intervention statistics.
        
        Returns:
            Intervention statistics
        """
        if not self.intervention_history:
            return {
                'totalInterventions': 0,
                'byType': {},
                'mostCommon': None
            }
        
        # Count by type
        by_type = {}
        for intervention in self.intervention_history:
            itype = intervention['type']
            by_type[itype] = by_type.get(itype, 0) + 1
        
        # Find most common
        most_common = max(by_type.items(), key=lambda x: x[1])[0] if by_type else None
        
        return {
            'totalInterventions': len(self.intervention_history),
            'byType': by_type,
            'mostCommon': most_common
        }
    
    def reset_session(self):
        """Reset session state"""
        self.distraction_count = 0
        self.intervention_history = []
        self.session_start_time = None


# Global engine instance
_engine = None


def get_intervention_engine() -> InterventionEngine:
    """Get or create global intervention engine"""
    global _engine
    if _engine is None:
        _engine = InterventionEngine()
    return _engine
