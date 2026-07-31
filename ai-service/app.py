from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
os.environ['TF_USE_LEGACY_KERAS'] = '1'
import logging

# Import configuration and utilities
from config import Config
from utils import ImagePreprocessor, EmotionPredictor

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
Config.init_app(app)

# Enable CORS
CORS(app, origins=Config.CORS_ORIGINS)

# Initialize AI components
print("=" * 50)
print("Initializing Emotion AI Service")
print("=" * 50)

preprocessor = ImagePreprocessor()
predictor = EmotionPredictor()

print(f"Model loaded: {predictor.is_model_loaded()}")
print(f"Model path: {Config.MODEL_PATH}")
print(f"Input size: {Config.MODEL_INPUT_SIZE}")
print("=" * 50)

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with service information"""
    return jsonify({
        "service": "Emotion Recognition AI Service",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "health": "/health",
            "predict": "/predict",
            "batch_predict": "/batch_predict",
            "model_info": "/model/info"
        },
        "timestamp": datetime.now().isoformat()
    })

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": predictor.is_model_loaded(),
        "model_path": Config.MODEL_PATH,
        "timestamp": datetime.now().isoformat()
    })

@app.route('/model/info', methods=['GET'])
def model_info():
    """Get model information"""
    return jsonify({
        **predictor.get_model_info(),
        "timestamp": datetime.now().isoformat()
    })

@app.route('/predict', methods=['POST'])
def predict():
    """
    Predict emotion from a single image
    
    Request body:
    {
        "image": "base64_encoded_image_string"
    }
    
    Response:
    {
        "success": true,
        "emotion": "Happy",
        "confidence": 0.96,
        "class_id": 3,
        "probabilities": {...},
        "color": "#FFD93D",
        "description": "Expression of pleasure or contentment"
    }
    """
    try:
        data = request.json
        
        if not data or 'image' not in data:
            return jsonify({
                "success": False,
                "error": "No image provided"
            }), 400
        
        # Preprocess image
        preprocessed_img, is_valid = preprocessor.preprocess_image(data['image'])
        
        if not is_valid:
            return jsonify({
                "success": False,
                "error": "No face detected in image"
            }), 400
        
        # Predict emotion
        result = predictor.predict(preprocessed_img)
        
        if 'error' in result:
            return jsonify({
                "success": False,
                "error": result['error']
            }), 500
        
        return jsonify({
            "success": True,
            **result,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Error in predict endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """
    Predict emotions from multiple images
    
    Request body:
    {
        "images": ["base64_image_1", "base64_image_2", ...]
    }
    
    Response:
    {
        "success": true,
        "results": [
            {
                "emotion": "Happy",
                "confidence": 0.96,
                ...
            },
            ...
        ]
    }
    """
    try:
        data = request.json
        
        if not data or 'images' not in data:
            return jsonify({
                "success": False,
                "error": "No images provided"
            }), 400
        
        images = data['images']
        
        if not isinstance(images, list):
            return jsonify({
                "success": False,
                "error": "Images must be an array"
            }), 400
        
        # Preprocess images
        preprocessed_images, valid_images = preprocessor.preprocess_batch(images)
        
        # Predict emotions
        results = predictor.predict_batch(preprocessed_images)
        
        return jsonify({
            "success": True,
            "results": results,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

from engagement_scorer import EngagementScorer
engagement_scorer = EngagementScorer()

@app.route('/ai/score', methods=['POST'])
def calculate_engagement_score():
    """Calculate engagement score for a session window"""
    try:
        data = request.json
        if not data or 'frames' not in data:
            return jsonify({
                "success": False,
                "error": "No frames provided"
            }), 400
            
        frames = data['frames']
        result = engagement_scorer.aggregate_window(frames)
        
        return jsonify(result)
        
    except Exception as e:
        logger.error(f"Error in /ai/score endpoint: {e}")
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404

@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500

if __name__ == '__main__':
    print(f"\nStarting Flask AI Service on {Config.HOST}:{Config.PORT}")
    print(f"Debug mode: {Config.DEBUG}")
    print(f"CORS origins: {Config.CORS_ORIGINS}")
    print("\nAvailable endpoints:")
    print("  GET  /              - Service information")
    print("  GET  /health        - Health check")
    print("  GET  /model/info    - Model information")
    print("  POST /predict       - Single image prediction")
    print("  POST /batch_predict - Batch image prediction")
    print("\n" + "=" * 50 + "\n")
    
    app.run(
        host=Config.HOST,
        port=Config.PORT,
        debug=Config.DEBUG
    )
