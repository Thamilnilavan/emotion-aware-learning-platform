from flask import Flask, jsonify, request
from flask_cors import CORS
import os
import cv2
import numpy as np
import base64
from datetime import datetime
from dotenv import load_dotenv

# Import our custom modules
from emotion_detector import EmotionDetector
from attention_tracker import AttentionTracker
from engagement_scorer import EngagementScorer

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Enable CORS
CORS(app, origins=os.getenv('CORS_ORIGINS', '*').split(','))

# Initialize AI components
model_path = os.getenv('MODEL_PATH', 'model/emotion_model.h5')
confidence_threshold = float(os.getenv('CONFIDENCE_THRESHOLD', 0.55))

print("Initializing AI components...")
emotion_detector = EmotionDetector(model_path, confidence_threshold)
attention_tracker = AttentionTracker()
engagement_scorer = EngagementScorer()

@app.route('/health', methods=['GET'])
def health():
    """Checks if model is loaded and MediaPipe is available"""
    return jsonify({
        "status": "ok",
        "model_loaded": not emotion_detector.demo_mode,
        "demo_mode": emotion_detector.demo_mode,
        "mediapipe": True, # MediaPipe is available if attention_tracker initialized without errors
        "timestamp": datetime.now().isoformat()
    })

@app.route('/analyse', methods=['POST'])
def analyse():
    """Receives a JPEG frame, runs emotion detection + attention tracking, returns results"""
    try:
        data = request.json
        if not data or 'frame' not in data:
            return jsonify({"error": "No frame provided"}), 400
            
        # Assuming frame is base64 encoded JPEG
        frame_data = data['frame']
        if ',' in frame_data:
            frame_data = frame_data.split(',')[1]
            
        frame_bytes = base64.b64decode(frame_data)
        np_arr = np.frombuffer(frame_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({"error": "Failed to decode image"}), 400
            
        # Run emotion detection
        emotion, emotion_confidence = emotion_detector.detect(frame)
        
        # Run attention tracking (MediaPipe requires RGB)
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        is_attentive = attention_tracker.process_frame(frame_rgb)
        
        return jsonify({
            "emotion": emotion,
            "emotion_confidence": float(emotion_confidence),
            "attention": is_attentive,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in analyse endpoint: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/score', methods=['POST'])
def score():
    """Receives 30 seconds of frames, computes engagement score and state"""
    try:
        data = request.json
        if not data or 'frames' not in data:
            return jsonify({"error": "No frames provided"}), 400
            
        frames = data['frames']
        result = engagement_scorer.aggregate_window(frames)
        
        return jsonify({
            "score": result['score'],
            "state": result['state'],
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"Error in score endpoint: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    env = os.getenv('FLASK_ENV', 'development')
    
    print(f" * Running on http://0.0.0.0:{port}")
    print(f" * Model loaded: {not emotion_detector.demo_mode}")
    print(f" * Demo mode: {emotion_detector.demo_mode}")
    print(f" * MediaPipe: True")
    
    app.run(host='0.0.0.0', port=port, debug=(env == 'development'))
