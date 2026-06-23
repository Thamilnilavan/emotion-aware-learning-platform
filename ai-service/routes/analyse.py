"""
Route for analyzing a single frame
"""

from flask import Blueprint, request, jsonify
from emotion.detector import get_detector
from attention.attention_score import get_attention_scorer
import cv2
import numpy as np

analyse_bp = Blueprint('analyse', __name__)


@analyse_bp.route('/ai/analyse', methods=['POST'])
def analyse_frame():
    """
    Analyze a single frame for emotion and attention.
    
    Request:
        {
            "frame": "base64-image"
        }
    
    Response:
        {
            "emotion": "happy",
            "confidence": 0.92,
            "attention": 88,
            "yaw": 3.2,
            "pitch": -1.8,
            "roll": 0.5
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({'error': 'No frame provided'}), 400
        
        frame_base64 = data['frame']
        
        # Decode frame
        import base64
        if ',' in frame_base64:
            frame_base64 = frame_base64.split(',')[1]
        image_bytes = base64.b64decode(frame_base64)
        nparr = np.frombuffer(image_bytes, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if image is None:
            return jsonify({'error': 'Invalid image data'}), 400
        
        # Detect emotion
        detector = get_detector()
        emotion_result = detector.detect_emotion(image, detect_face=True)
        
        # Calculate attention
        attention_scorer = get_attention_scorer()
        attention_result = attention_scorer.calculate_attention_score(image)
        
        # Combine results
        response = {
            'emotion': emotion_result['emotion'],
            'confidence': emotion_result['confidence'],
            'attention': attention_result['attention'],
            'yaw': attention_result['yaw'],
            'pitch': attention_result['pitch'],
            'roll': attention_result['roll'],
            'faceDetected': emotion_result['faceDetected'],
            'eyesDetected': attention_result['eyesDetected']
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
