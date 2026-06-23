"""
Attention score calculation combining eye tracking and head pose
"""

import numpy as np
from typing import List, Dict
from .eye_tracking import get_eye_tracker
from .head_pose import get_head_pose_estimator
import config


class AttentionScorer:
    """Attention score calculation"""
    
    def __init__(self):
        """Initialize attention scorer"""
        self.eye_tracker = get_eye_tracker()
        self.head_pose_estimator = get_head_pose_estimator()
        self.blink_history = []
        self.gaze_history = []
    
    def calculate_eye_attention(self, eye_analysis: dict) -> float:
        """
        Calculate attention score from eye analysis.
        
        Args:
            eye_analysis: Eye analysis results
            
        Returns:
            Eye attention score [0, 1]
        """
        if not eye_analysis['eyesDetected']:
            return 0.0
        
        # Penalize blinks
        if eye_analysis['blinkDetected']:
            return 0.5
        
        # Check gaze direction
        gaze_h = eye_analysis['gazeHorizontal']
        gaze_v = eye_analysis['gazeVertical']
        
        # Calculate distance from center
        gaze_distance = np.sqrt(gaze_h**2 + gaze_v**2)
        
        # Score based on gaze (closer to center = higher attention)
        eye_score = max(0, 1 - gaze_distance / config.EYE_GAZE_THRESHOLD)
        
        return eye_score
    
    def calculate_head_attention(self, head_pose: dict) -> float:
        """
        Calculate attention score from head pose.
        
        Args:
            head_pose: Head pose results
            
        Returns:
            Head attention score [0, 1]
        """
        if not head_pose['faceDetected']:
            return 0.0
        
        if head_pose['lookingForward']:
            return 1.0
        
        # Calculate deviation from forward
        yaw = abs(head_pose['yaw'])
        pitch = abs(head_pose['pitch'])
        roll = abs(head_pose['roll'])
        
        # Normalize by threshold
        yaw_score = max(0, 1 - yaw / config.HEAD_POSE_THRESHOLD)
        pitch_score = max(0, 1 - pitch / config.HEAD_POSE_THRESHOLD)
        roll_score = max(0, 1 - roll / config.HEAD_POSE_THRESHOLD)
        
        # Average
        head_score = (yaw_score + pitch_score + roll_score) / 3
        
        return head_score
    
    def calculate_attention_score(self, image: np.ndarray) -> dict:
        """
        Calculate overall attention score from image.
        
        Args:
            image: Input image
            
        Returns:
            Attention analysis results
        """
        # Get eye analysis
        eye_analysis = self.eye_tracker.analyze_eyes(image)
        eye_score = self.calculate_eye_attention(eye_analysis)
        
        # Get head pose
        head_pose = self.head_pose_estimator.estimate_head_pose(image)
        head_score = self.calculate_head_attention(head_pose)
        
        # Combined attention score (weighted)
        attention_score = 0.6 * eye_score + 0.4 * head_score
        
        # Convert to percentage
        attention_percent = int(attention_score * 100)
        
        return {
            'attention': attention_percent,
            'eyeScore': int(eye_score * 100),
            'headScore': int(head_score * 100),
            'eyesDetected': eye_analysis['eyesDetected'],
            'blinkDetected': eye_analysis['blinkDetected'],
            'gazeHorizontal': eye_analysis['gazeHorizontal'],
            'gazeVertical': eye_analysis['gazeVertical'],
            'yaw': head_pose['yaw'],
            'pitch': head_pose['pitch'],
            'roll': head_pose['roll'],
            'lookingForward': head_pose['lookingForward']
        }
    
    def calculate_attention_from_history(self, history: List[dict]) -> dict:
        """
        Calculate attention metrics from frame history.
        
        Args:
            history: List of attention analysis results
            
        Returns:
            Aggregated attention metrics
        """
        if not history:
            return {
                'averageAttention': 0,
                'focusPercentage': 0,
                'totalBlinks': 0,
                'lookingForwardPercentage': 0
            }
        
        # Calculate averages
        attentions = [h['attention'] for h in history]
        avg_attention = np.mean(attentions)
        
        # Focus percentage (attention > threshold)
        focus_count = sum(1 for a in attentions if a > config.ATTENTION_THRESHOLD * 100)
        focus_percentage = (focus_count / len(attentions)) * 100
        
        # Total blinks
        total_blinks = sum(1 for h in history if h['blinkDetected'])
        
        # Looking forward percentage
        looking_forward_count = sum(1 for h in history if h['lookingForward'])
        looking_forward_percentage = (looking_forward_count / len(history)) * 100
        
        return {
            'averageAttention': int(avg_attention),
            'focusPercentage': int(focus_percentage),
            'totalBlinks': total_blinks,
            'lookingForwardPercentage': int(looking_forward_percentage)
        }


# Global scorer instance
_scorer = None


def get_attention_scorer() -> AttentionScorer:
    """Get or create global attention scorer"""
    global _scorer
    if _scorer is None:
        _scorer = AttentionScorer()
    return _scorer
