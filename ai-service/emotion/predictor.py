"""
Emotion prediction using trained CNN model
"""

import numpy as np
import tensorflow as tf
from pathlib import Path
import json
import config
from .preprocess import preprocess_image, decode_base64_image


class EmotionPredictor:
    """Emotion prediction class using trained CNN model"""
    
    def __init__(self, model_path: Path = None):
        """
        Initialize emotion predictor.
        
        Args:
            model_path: Path to trained model file
        """
        self.model_path = model_path or config.EMOTION_MODEL_PATH
        self.model = None
        self.emotions = config.EMOTIONS
        self._load_model()
    
    def _load_model(self):
        """Load trained emotion detection model"""
        try:
            if self.model_path.exists():
                self.model = tf.keras.models.load_model(str(self.model_path))
                print(f"Loaded emotion model from {self.model_path}")
            else:
                print(f"Warning: Model file not found at {self.model_path}")
                print("Using placeholder predictions")
        except Exception as e:
            print(f"Error loading model: {e}")
            print("Using placeholder predictions")
    
    def predict(self, image: np.ndarray) -> dict:
        """
        Predict emotion from image.
        
        Args:
            image: Input image (numpy array or base64 string)
            
        Returns:
            Dictionary with emotion prediction results
        """
        if isinstance(image, str):
            image = decode_base64_image(image)
        
        if self.model is not None:
            # Preprocess
            processed = preprocess_image(image)
            
            # Predict
            predictions = self.model.predict(processed, verbose=0)[0]
            
            # Get top emotion
            emotion_idx = np.argmax(predictions)
            emotion = self.emotions[emotion_idx]
            confidence = float(predictions[emotion_idx])
            
            # Get all probabilities
            emotion_probs = {
                self.emotions[i]: float(predictions[i])
                for i in range(len(self.emotions))
            }
            
            return {
                'emotion': emotion,
                'confidence': confidence,
                'emotionProbabilities': emotion_probs
            }
        else:
            # Placeholder prediction
            import random
            emotion = random.choice(self.emotions)
            confidence = random.uniform(0.7, 0.95)
            emotion_probs = {e: random.uniform(0.0, 0.3) for e in self.emotions}
            emotion_probs[emotion] = confidence
            
            return {
                'emotion': emotion,
                'confidence': confidence,
                'emotionProbabilities': emotion_probs
            }
    
    def predict_batch(self, images: list) -> list:
        """
        Predict emotions for batch of images.
        
        Args:
            images: List of images (numpy arrays or base64 strings)
            
        Returns:
            List of prediction dictionaries
        """
        return [self.predict(img) for img in images]


# Global predictor instance
_predictor = None


def get_predictor() -> EmotionPredictor:
    """Get or create global predictor instance"""
    global _predictor
    if _predictor is None:
        _predictor = EmotionPredictor()
    return _predictor
