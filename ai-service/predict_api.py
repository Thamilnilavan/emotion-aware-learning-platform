from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import os
import tensorflow as tf
from tensorflow.keras.preprocessing import image
from tensorflow.keras.models import load_model
import os
import base64
from PIL import Image
import io
from config import Config

app = Flask(__name__)
CORS(app)

# Configuration
MODEL_PATH = Config.MODEL_PATH
IMG_SIZE = Config.MODEL_INPUT_SIZE
EMOTIONS = ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted']

# Load model
model = None

def load_trained_model():
    """Load the trained emotion detection model"""
    global model
    try:
        if os.path.exists(MODEL_PATH):
            model = load_model(MODEL_PATH, compile=False)
            print(f"Model loaded successfully from {MODEL_PATH}")
            return True
        else:
            print(f"Model file not found at {MODEL_PATH}")
            return False
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

def preprocess_image(img_array):
    """Preprocess image for prediction"""
    img = image.img_to_array(img_array)
    img = np.expand_dims(img, axis=0)
    img = img / 255.0  # Normalize
    return img

def decode_base64_image(base64_string):
    """Decode base64 string to image"""
    if base64_string.startswith('data:image'):
        base64_string = base64_string.split(',')[1]
    
    img_data = base64.b64decode(base64_string)
    img = Image.open(io.BytesIO(img_data))
    img = img.convert('RGB')
    img = img.resize(IMG_SIZE)
    return img

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict_emotion():
    """Predict emotion from image"""
    if model is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'image' not in data:
            return jsonify({
                'success': False,
                'error': 'No image provided'
            }), 400
        
        # Decode image
        img = decode_base64_image(data['image'])
        
        # Preprocess
        processed_img = preprocess_image(img)
        
        # Predict
        predictions = model.predict(processed_img, verbose=0)
        predicted_class = np.argmax(predictions[0])
        confidence = float(predictions[0][predicted_class])
        
        # Get all emotion probabilities
        emotion_probabilities = {
            emotion: float(prob) 
            for emotion, prob in zip(EMOTIONS, predictions[0])
        }
        
        return jsonify({
            'success': True,
            'prediction': EMOTIONS[predicted_class],
            'confidence': confidence,
            'probabilities': emotion_probabilities
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/batch_predict', methods=['POST'])
def batch_predict():
    """Predict emotions for multiple images"""
    if model is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    try:
        data = request.get_json()
        
        if not data or 'images' not in data:
            return jsonify({
                'success': False,
                'error': 'No images provided'
            }), 400
        
        images = data['images']
        results = []
        
        for img_data in images:
            try:
                img = decode_base64_image(img_data)
                processed_img = preprocess_image(img)
                predictions = model.predict(processed_img, verbose=0)
                predicted_class = np.argmax(predictions[0])
                confidence = float(predictions[0][predicted_class])
                
                results.append({
                    'prediction': EMOTIONS[predicted_class],
                    'confidence': confidence,
                    'probabilities': {
                        emotion: float(prob) 
                        for emotion, prob in zip(EMOTIONS, predictions[0])
                    }
                })
            except Exception as e:
                results.append({
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'results': results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Load model on startup
    print("Starting Flask prediction API...")
    if load_trained_model():
        print("Model loaded successfully")
    else:
        print("Warning: Model not loaded. API will return errors for predictions.")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
