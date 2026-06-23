"""
State classification based on engagement score
"""

import config


class StateClassifier:
    """Classify learning state from engagement score"""
    
    def __init__(self):
        """Initialize state classifier"""
        self.thresholds = config.ENGAGEMENT_THRESHOLDS
    
    def classify(self, engagement_score: int, emotion: str = None) -> dict:
        """
        Classify learning state.
        
        Args:
            engagement_score: Engagement score [0, 100]
            emotion: Current emotion (optional)
            
        Returns:
            State classification results
        """
        # Determine state based on engagement score
        if engagement_score >= self.thresholds['ENGAGED']:
            state = 'ENGAGED'
        elif engagement_score >= self.thresholds['MILD_DISTRACTION']:
            state = 'MILD_DISTRACTION'
        elif engagement_score >= self.thresholds['DISTRACTED']:
            state = 'DISTRACTED'
        else:
            state = 'BREAK_NEEDED'
        
        # Override if negative emotion detected
        if emotion and emotion in config.NEGATIVE_EMOTIONS:
            if state != 'BREAK_NEEDED':
                state = 'NEGATIVE_AFFECT'
        
        # Get state description
        description = self.get_state_description(state)
        
        return {
            'state': state,
            'description': description,
            'engagementScore': engagement_score
        }
    
    def get_state_description(self, state: str) -> str:
        """
        Get human-readable state description.
        
        Args:
            state: State code
            
        Returns:
            State description
        """
        descriptions = {
            'ENGAGED': 'Student is highly engaged and focused on learning',
            'MILD_DISTRACTION': 'Student shows mild signs of distraction',
            'DISTRACTED': 'Student is significantly distracted',
            'NEGATIVE_AFFECT': 'Student is experiencing negative emotions',
            'BREAK_NEEDED': 'Student needs a break from learning'
        }
        return descriptions.get(state, 'Unknown state')
    
    def get_state_color(self, state: str) -> str:
        """
        Get color code for state.
        
        Args:
            state: State code
            
        Returns:
            Color code (hex)
        """
        colors = {
            'ENGAGED': '#10B981',  # Green
            'MILD_DISTRACTION': '#F59E0B',  # Amber
            'DISTRACTED': '#EF4444',  # Red
            'NEGATIVE_AFFECT': '#8B5CF6',  # Purple
            'BREAK_NEEDED': '#6366F1'  # Indigo
        }
        return colors.get(state, '#6B7280')  # Gray default


# Global classifier instance
_classifier = None


def get_state_classifier() -> StateClassifier:
    """Get or create global state classifier"""
    global _classifier
    if _classifier is None:
        _classifier = StateClassifier()
    return _classifier
