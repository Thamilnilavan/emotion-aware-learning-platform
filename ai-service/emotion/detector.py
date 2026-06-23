"""
Emotion detection module - integrates face detection and emotion prediction
"""

import cv2
import numpy as np
from typing import Optional, Tuple, List, Dict
from .predictor import EmotionPredictor, get_predictor
from .preprocess import preprocess_image, decode_base64_image, face_detection_preprocess
import config


class EmotionDetector:
    """Main emotion detection class"""
    
    def __init__(self):
        """Initialize emotion detector"""
        self.predictor = get_predictor()
        self.face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    
    def detect_faces(self, image: np.ndarray) -> List[Tuple[int, int, int, int]]:
        """
        Detect faces in image using OpenCV Haar cascade.
        
        Args:
            image: Input image
            
        Returns:
            List of bounding boxes (x, y, w, h)
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        faces = self.face_cascade.detectMultiScale(
            gray,
            scaleFactor=1.1,
            minNeighbors=5,
            minSize=(30, 30)
        )
        return faces
    
    def detect_emotion(self, image: np.ndarray, detect_face: bool = True) -> Dict:
        """
        Detect emotion from image.
        
        Args:
            image: Input image (numpy array or base64 string)
            detect_face: Whether to detect face first
            
        Returns:
            Dictionary with emotion detection results
        """
        if isinstance(image, str):
            image = decode_base64_image(image)
        
        # Detect face if requested
        face_bbox = None
        if detect_face:
            faces = self.detect_faces(image)
            if len(faces) > 0:
                face_bbox = faces[0]  # Use first face
        
        # Predict emotion
        emotion_result = self.predictor.predict(image)
        
        return {
            'emotion': emotion_result['emotion'],
            'confidence': emotion_result['confidence'],
            'emotionProbabilities': emotion_result['emotionProbabilities'],
            'faceDetected': face_bbox is not None,
            'faceBoundingBox': face_bbox.tolist() if face_bbox is not None else None
        }
    
    def analyze_frame(self, frame: str) -> Dict:
        """
        Analyze a single frame for emotion detection.
        
        Args:
            frame: Base64 encoded image string
            
        Returns:
            Analysis results
        """
        return self.detect_emotion(frame, detect_face=True)


# Global detector instance
_detector = None


def get_detector() -> EmotionDetector:
    """Get or create global detector instance"""
    global _detector
    if _detector is None:
        _detector = EmotionDetector()
    return _detector


__all__ = ['EmotionDetector', 'get_detector']
