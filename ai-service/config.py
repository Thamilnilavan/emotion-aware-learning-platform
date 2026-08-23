import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Configuration for Flask AI Service"""
    
    # Flask Configuration
    SECRET_KEY = os.getenv('SECRET_KEY', 'emotion-ai-secret-key-2026')
    DEBUG = os.getenv('DEBUG', 'False').lower() == 'true'
    HOST = os.getenv('HOST', '0.0.0.0')
    PORT = int(os.getenv('PORT') or os.getenv('FLASK_PORT') or 5000)
    
    # Model Configuration
    MODEL_DIRECTORY = os.path.join(
        os.path.dirname(__file__), 'model', 'Eduvo_EfficientNetB3_RAFDB'
    )
    _configured_model_path = os.getenv('MODEL_PATH')
    MODEL_PATH = (
        _configured_model_path
        if _configured_model_path and os.path.isabs(_configured_model_path)
        else os.path.join(os.path.dirname(__file__), _configured_model_path)
        if _configured_model_path
        # The training model card identifies stage 3 as the best checkpoint.
        else os.path.join(MODEL_DIRECTORY, 'stage3_best.keras')
    )
    MODEL_PATH = os.path.normpath(MODEL_PATH)
    MODEL_CARD_PATH = os.path.join(MODEL_DIRECTORY, 'model_card.json')
    MODEL_INPUT_SIZE = (300, 300)  # EfficientNet-B3 input size
    
    # MediaPipe Configuration
    MEDIAPIPE_MAX_NUM_FACES = 1
    MEDIAPIPE_MIN_DETECTION_CONFIDENCE = 0.5
    MEDIAPIPE_MIN_TRACKING_CONFIDENCE = 0.5
    
    # Upload Configuration
    UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}
    
    # Logging Configuration
    LOG_FOLDER = os.path.join(os.path.dirname(__file__), 'logs')
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    
    # CORS Configuration
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')
    
    @staticmethod
    def init_app(app):
        """Initialize Flask app with configuration"""
        
        # Create necessary directories
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(Config.LOG_FOLDER, exist_ok=True)
        
        # Configure upload folder
        app.config['UPLOAD_FOLDER'] = Config.UPLOAD_FOLDER
        app.config['MAX_CONTENT_LENGTH'] = Config.MAX_CONTENT_LENGTH
