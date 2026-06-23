"""
Configuration for AI Service
"""

import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
MODELS_DIR = BASE_DIR / 'models'
DATASETS_DIR = BASE_DIR / 'datasets'
SAVED_MODELS_DIR = BASE_DIR / 'saved_models'

# Flask configuration
FLASK_HOST = os.getenv('FLASK_HOST', '0.0.0.0')
FLASK_PORT = int(os.getenv('FLASK_PORT', 5000))
FLASK_DEBUG = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'

# Model paths
EMOTION_MODEL_PATH = MODELS_DIR / 'emotion_model.h5'
MOBILENET_MODEL_PATH = MODELS_DIR / 'mobilenet_model.h5'
LABEL_ENCODER_PATH = MODELS_DIR / 'label_encoder.pkl'

# Alternative: Use saved_models from training
EMOTION_MODEL_PATH = SAVED_MODELS_DIR / 'emotion_detector' / 'best_model.keras'

# Image processing
IMAGE_SIZE = 96
IMAGE_CHANNELS = 3
INPUT_SHAPE = (IMAGE_SIZE, IMAGE_SIZE, IMAGE_CHANNELS)

# Emotion labels
EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
NUM_EMOTION_CLASSES = len(EMOTIONS)

# Engagement thresholds
ENGAGEMENT_THRESHOLDS = {
    'ENGAGED': 70,
    'MILD_DISTRACTION': 45,
    'DISTRACTED': 20,
    'NEGATIVE_AFFECT': 0,
    'BREAK_NEEDED': 0
}

# Intervention types
INTERVENTION_TYPES = ['NUDGE', 'ALERT', 'PAUSE', 'SUPPORT', 'BREAK']

# MediaPipe configuration
MEDIAPIPE_MAX_NUM_FACES = 1
MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.5
MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5

# Attention thresholds
ATTENTION_THRESHOLD = 0.7
HEAD_POSE_THRESHOLD = 30  # degrees
EYE_GAZE_THRESHOLD = 0.3

# Scoring weights
ENGAGEMENT_WEIGHTS = {
    'emotion': 0.4,
    'attention': 0.5,
    'interaction': 0.1
}

# Negative emotions for support intervention
NEGATIVE_EMOTIONS = ['Sad', 'Angry', 'Fear', 'Disgust']

# Break configuration
BREAK_DURATION_SECONDS = 300  # 5 minutes
LONG_SESSION_THRESHOLD_MINUTES = 25

# Model metrics (placeholder - loaded from training metadata)
MODEL_METRICS = {
    'accuracy': 0.0,
    'precision': 0.0,
    'recall': 0.0,
    'f1Score': 0.0
}

# Logging
LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

# CORS
CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
