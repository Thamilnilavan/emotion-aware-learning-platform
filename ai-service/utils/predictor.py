"""
Emotion prediction using trained EfficientNet-B3 model
"""

import os
import numpy as np
import tensorflow as tf
from config import Config
from .labels import EMOTION_LABELS, get_emotion_label, get_emotion_color, get_emotion_description


class EmotionPredictor:
    """Emotion prediction using trained model"""
    
    def __init__(self):
        """Initialize predictor and load model"""
        self.model = None
        self.model_loaded = False
        self.load_model()
    
    def load_model(self):
        """Load the trained emotion recognition model"""
        try:
            if os.path.exists(Config.MODEL_PATH):
                print(f"Loading model from {Config.MODEL_PATH}")
                # Inference does not need the training optimizer/loss state and
                # skipping it avoids checkpoint compatibility issues.
                self.model = tf.keras.models.load_model(
                    Config.MODEL_PATH, compile=False
                )
                expected_input = (None, *Config.MODEL_INPUT_SIZE, 3)
                if tuple(self.model.input_shape) != expected_input:
                    raise ValueError(
                        f'Unexpected model input {self.model.input_shape}; expected {expected_input}'
                    )
                if int(self.model.output_shape[-1]) != len(EMOTION_LABELS):
                    raise ValueError(
                        f'Unexpected model output {self.model.output_shape}; '
                        f'expected {len(EMOTION_LABELS)} classes'
                    )
                self.model_loaded = True
                print("Model loaded successfully")
            else:
                print(f"Model file not found at {Config.MODEL_PATH}")
                print("Please train the model first using train_model.py")
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model_loaded = False
    
    def predict(self, preprocessed_image):
        """
        Predict emotion from preprocessed image
        
        Args:
            preprocessed_image: Preprocessed image tensor
            
        Returns:
            Prediction result with emotion, confidence, and class_id
        """
        if not self.model_loaded:
            return {
                'error': 'Model not loaded',
                'emotion': 'Unknown',
                'confidence': 0.0,
                'class_id': -1
            }
        
        try:
            # Match the model-card evaluation: average the original face and a
            # horizontal flip. This is more stable for asymmetric webcam poses.
            flipped_image = np.flip(preprocessed_image, axis=2).copy()
            tta_batch = np.concatenate([preprocessed_image, flipped_image], axis=0)
            tta_predictions = self.model.predict(tta_batch, verbose=0)
            predictions = np.mean(tta_predictions, axis=0, keepdims=True)
            
            # Get predicted class
            class_id = np.argmax(predictions[0])
            confidence = float(predictions[0][class_id])
            
            # Get emotion label
            emotion = get_emotion_label(class_id)
            
            # Get all probabilities
            probabilities = {
                get_emotion_label(i): float(predictions[0][i])
                for i in range(len(predictions[0]))
            }
            
            return {
                'emotion': emotion,
                'confidence': confidence,
                'class_id': int(class_id),
                'probabilities': probabilities,
                'color': get_emotion_color(emotion),
                'description': get_emotion_description(emotion)
            }
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return {
                'error': str(e),
                'emotion': 'Unknown',
                'confidence': 0.0,
                'class_id': -1
            }
    
    def predict_batch(self, preprocessed_images):
        """
        Predict emotions for multiple images
        
        Args:
            preprocessed_images: List of preprocessed image tensors
            
        Returns:
            List of prediction results
        """
        if not self.model_loaded:
            return [{
                'error': 'Model not loaded',
                'emotion': 'Unknown',
                'confidence': 0.0,
                'class_id': -1
            } for _ in preprocessed_images]
        
        try:
            # Filter out None values
            valid_images = [img for img in preprocessed_images if img is not None]
            
            if not valid_images:
                return [{
                    'error': 'No valid images',
                    'emotion': 'Unknown',
                    'confidence': 0.0,
                    'class_id': -1
                } for _ in preprocessed_images]
            
            # Stack images for batch prediction
            batch = np.vstack(valid_images)
            
            # Horizontal-flip test-time averaging, as used in model evaluation.
            augmented_batch = np.concatenate([batch, np.flip(batch, axis=2)], axis=0)
            augmented_predictions = self.model.predict(augmented_batch, verbose=0)
            batch_size = len(batch)
            predictions = (
                augmented_predictions[:batch_size] + augmented_predictions[batch_size:]
            ) / 2.0
            
            results = []
            valid_idx = 0
            
            for i, preprocessed_img in enumerate(preprocessed_images):
                if preprocessed_img is None:
                    results.append({
                        'error': 'No face detected',
                        'emotion': 'Unknown',
                        'confidence': 0.0,
                        'class_id': -1
                    })
                else:
                    class_id = np.argmax(predictions[valid_idx])
                    confidence = float(predictions[valid_idx][class_id])
                    emotion = get_emotion_label(class_id)
                    
                    results.append({
                        'emotion': emotion,
                        'confidence': confidence,
                        'class_id': int(class_id),
                        'probabilities': {
                            get_emotion_label(j): float(predictions[valid_idx][j])
                            for j in range(len(predictions[valid_idx]))
                        },
                        'color': get_emotion_color(emotion),
                        'description': get_emotion_description(emotion)
                    })
                    valid_idx += 1
            
            return results
            
        except Exception as e:
            print(f"Batch prediction error: {e}")
            return [{
                'error': str(e),
                'emotion': 'Unknown',
                'confidence': 0.0,
                'class_id': -1
            } for _ in preprocessed_images]
    
    def is_model_loaded(self):
        """Check if model is loaded"""
        return self.model_loaded
    
    def get_model_info(self):
        """Get model information"""
        if not self.model_loaded:
            return {
                'loaded': False,
                'model_path': Config.MODEL_PATH
            }
        
        return {
            'loaded': True,
            'model_path': Config.MODEL_PATH,
            'input_shape': self.model.input_shape,
            'output_shape': self.model.output_shape,
            'num_classes': self.model.output_shape[1]
        }
