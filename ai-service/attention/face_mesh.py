"""
Face mesh detection using MediaPipe
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Optional, Tuple, List
import config


class FaceMeshDetector:
    """Face mesh detection using MediaPipe"""
    
    def __init__(self):
        """Initialize MediaPipe Face Mesh"""
        self.mp_face_mesh = mp.solutions.face_mesh
        self.face_mesh = self.mp_face_mesh.FaceMesh(
            max_num_faces=config.MEDIAPIPE_MAX_NUM_FACES,
            min_detection_confidence=config.MEDIAPIPE_MIN_DETECTION_CONFIDENCE,
            min_tracking_confidence=config.MEDIAPIPE_MIN_TRACKING_CONFIDENCE
        )
    
    def detect(self, image: np.ndarray) -> Optional[List[Tuple[float, float]]]:
        """
        Detect face mesh landmarks.
        
        Args:
            image: Input image (BGR format)
            
        Returns:
            List of landmark coordinates (normalized) or None
        """
        # Convert BGR to RGB
        image_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        
        # Process
        results = self.face_mesh.process(image_rgb)
        
        if results.multi_face_landmarks:
            landmarks = results.multi_face_landmarks[0]
            landmark_points = []
            
            for landmark in landmarks.landmark:
                landmark_points.append((landmark.x, landmark.y))
            
            return landmark_points
        
        return None
    
    def get_landmarks_468(self, image: np.ndarray) -> Optional[np.ndarray]:
        """
        Get 468 face mesh landmarks.
        
        Args:
            image: Input image
            
        Returns:
            Numpy array of shape (468, 2) or None
        """
        landmarks = self.detect(image)
        if landmarks:
            return np.array(landmarks)
        return None


# Global detector instance
_detector = None


def get_face_mesh_detector() -> FaceMeshDetector:
    """Get or create global face mesh detector"""
    global _detector
    if _detector is None:
        _detector = FaceMeshDetector()
    return _detector
