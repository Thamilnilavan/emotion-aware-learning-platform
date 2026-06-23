"""
Eye tracking using MediaPipe face mesh landmarks
"""

import numpy as np
import cv2
from typing import Tuple, Optional
from .face_mesh import get_face_mesh_detector
import config


class EyeTracker:
    """Eye tracking using face mesh landmarks"""
    
    # Eye landmark indices (MediaPipe Face Mesh 468 points)
    LEFT_EYE_INDICES = [33, 160, 158, 133, 153, 144]
    RIGHT_EYE_INDICES = [362, 385, 387, 263, 373, 380]
    
    def __init__(self):
        """Initialize eye tracker"""
        self.face_mesh_detector = get_face_mesh_detector()
    
    def get_eye_landmarks(self, landmarks: np.ndarray, eye: str = 'left') -> np.ndarray:
        """
        Get eye landmarks from face mesh.
        
        Args:
            landmarks: Face mesh landmarks (468, 2)
            eye: 'left' or 'right'
            
        Returns:
            Eye landmarks (6, 2)
        """
        indices = self.LEFT_EYE_INDICES if eye == 'left' else self.RIGHT_EYE_INDICES
        return landmarks[indices]
    
    def calculate_eye_aspect_ratio(self, eye_landmarks: np.ndarray) -> float:
        """
        Calculate Eye Aspect Ratio (EAR) for blink detection.
        
        Args:
            eye_landmarks: Eye landmarks (6, 2)
            
        Returns:
            Eye aspect ratio
        """
        # Vertical eye landmarks
        A = np.linalg.norm(eye_landmarks[1] - eye_landmarks[5])
        B = np.linalg.norm(eye_landmarks[2] - eye_landmarks[4])
        
        # Horizontal eye landmarks
        C = np.linalg.norm(eye_landmarks[0] - eye_landmarks[3])
        
        # EAR
        ear = (A + B) / (2.0 * C)
        
        return ear
    
    def detect_blink(self, ear: float, threshold: float = 0.25) -> bool:
        """
        Detect blink based on eye aspect ratio.
        
        Args:
            ear: Eye aspect ratio
            threshold: Blink threshold
            
        Returns:
            True if blink detected
        """
        return ear < threshold
    
    def calculate_gaze_direction(self, eye_landmarks: np.ndarray) -> Tuple[float, float]:
        """
        Calculate gaze direction (horizontal, vertical).
        
        Args:
            eye_landmarks: Eye landmarks (6, 2)
            
        Returns:
            Gaze direction (horizontal, vertical) normalized [-1, 1]
        """
        # Calculate eye center
        eye_center = np.mean(eye_landmarks, axis=0)
        
        # Calculate iris position (approximate using inner landmarks)
        inner_left = eye_landmarks[0]
        inner_right = eye_landmarks[3]
        eye_width = np.linalg.norm(inner_right - inner_left)
        
        # Horizontal gaze (normalized)
        horizontal = (eye_center[0] - np.mean([inner_left[0], inner_right[0]])) / (eye_width / 2)
        
        # Vertical gaze (approximate)
        top = eye_landmarks[1]
        bottom = eye_landmarks[5]
        eye_height = np.linalg.norm(bottom - top)
        vertical = (eye_center[1] - np.mean([top[1], bottom[1]])) / (eye_height / 2)
        
        # Clamp to [-1, 1]
        horizontal = np.clip(horizontal, -1, 1)
        vertical = np.clip(vertical, -1, 1)
        
        return horizontal, vertical
    
    def analyze_eyes(self, image: np.ndarray) -> dict:
        """
        Analyze eyes from image.
        
        Args:
            image: Input image
            
        Returns:
            Eye analysis results
        """
        landmarks = self.face_mesh_detector.get_landmarks_468(image)
        
        if landmarks is None:
            return {
                'eyesDetected': False,
                'leftEAR': 0.0,
                'rightEAR': 0.0,
                'blinkDetected': False,
                'gazeHorizontal': 0.0,
                'gazeVertical': 0.0
            }
        
        # Get eye landmarks
        left_eye = self.get_eye_landmarks(landmarks, 'left')
        right_eye = self.get_eye_landmarks(landmarks, 'right')
        
        # Calculate EAR
        left_ear = self.calculate_eye_aspect_ratio(left_eye)
        right_ear = self.calculate_eye_aspect_ratio(right_eye)
        
        # Detect blink
        blink_left = self.detect_blink(left_ear)
        blink_right = self.detect_blink(right_ear)
        blink_detected = blink_left or blink_right
        
        # Calculate gaze
        gaze_h, gaze_v = self.calculate_gaze_direction(left_eye)
        
        return {
            'eyesDetected': True,
            'leftEAR': float(left_ear),
            'rightEAR': float(right_ear),
            'blinkDetected': blink_detected,
            'gazeHorizontal': float(gaze_h),
            'gazeVertical': float(gaze_v)
        }


# Global tracker instance
_tracker = None


def get_eye_tracker() -> EyeTracker:
    """Get or create global eye tracker"""
    global _tracker
    if _tracker is None:
        _tracker = EyeTracker()
    return _tracker
