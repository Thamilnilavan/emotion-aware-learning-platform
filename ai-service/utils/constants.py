"""
Constants for AI service
"""

# Emotion labels
EMOTIONS = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
NUM_EMOTION_CLASSES = len(EMOTIONS)

# Emotion emojis
EMOTION_EMOJIS = {
    'Angry': '😠',
    'Disgust': '🤢',
    'Fear': '😨',
    'Happy': '😊',
    'Sad': '😢',
    'Surprise': '😮',
    'Neutral': '😐'
}

# Engagement states
ENGAGEMENT_STATES = ['ENGAGED', 'MILD_DISTRACTION', 'DISTRACTED', 'NEGATIVE_AFFECT', 'BREAK_NEEDED']

# Intervention types
INTERVENTION_TYPES = ['NUDGE', 'ALERT', 'PAUSE', 'SUPPORT', 'BREAK']

# Intervention colors
INTERVENTION_COLORS = {
    'NUDGE': '#14B8A6',      # Teal
    'ALERT': '#F59E0B',     # Amber
    'PAUSE': '#EF4444',     # Red
    'SUPPORT': '#8B5CF6',   # Purple
    'BREAK': '#6366F1'      # Indigo
}

# State colors
STATE_COLORS = {
    'ENGAGED': '#10B981',           # Green
    'MILD_DISTRACTION': '#F59E0B',  # Amber
    'DISTRACTED': '#EF4444',         # Red
    'NEGATIVE_AFFECT': '#8B5CF6',    # Purple
    'BREAK_NEEDED': '#6366F1'        # Indigo
}

# Score colors
SCORE_COLOR_HIGH = '#10B981'    # Green
SCORE_COLOR_MEDIUM = '#F59E0B'   # Amber
SCORE_COLOR_LOW = '#EF4444'      # Red

# Time constants
FRAME_CAPTURE_INTERVAL_MS = 100
SCORE_WINDOW_INTERVAL_SEC = 30
BREAK_DURATION_SEC = 300
LONG_SESSION_THRESHOLD_MIN = 25

# Thresholds
ATTENTION_THRESHOLD = 0.7
HEAD_POSE_THRESHOLD_DEG = 30
EYE_GAZE_THRESHOLD = 0.3
ENGAGEMENT_THRESHOLD_HIGH = 70
ENGAGEMENT_THRESHOLD_MEDIUM = 45
ENGAGEMENT_THRESHOLD_LOW = 20

# MediaPipe constants
MEDIAPIPE_MAX_NUM_FACES = 1
MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.5
MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5

# Image constants
IMAGE_SIZE = 96
IMAGE_CHANNELS = 3
INPUT_SHAPE = (IMAGE_SIZE, IMAGE_SIZE, IMAGE_CHANNELS)

# API endpoints
API_ANALYZE = '/ai/analyse'
API_SCORE = '/ai/score'
API_INTERVENTION = '/ai/intervention'
API_HEALTH = '/ai/health'
API_MODEL_METRICS = '/ai/model-metrics'

# HTTP status codes
HTTP_OK = 200
HTTP_BAD_REQUEST = 400
HTTP_UNAUTHORIZED = 401
HTTP_FORBIDDEN = 403
HTTP_NOT_FOUND = 404
HTTP_SERVER_ERROR = 500
