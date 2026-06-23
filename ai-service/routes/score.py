"""
Route for calculating engagement score from frame history
"""

from flask import Blueprint, request, jsonify
from engagement.scorer import get_engagement_scorer
from engagement.state_classifier import get_state_classifier
import cv2
import numpy as np
import base64

score_bp = Blueprint('score', __name__)


@score_bp.route('/ai/score', methods=['POST'])
def calculate_engagement_score():
    """
    Calculate engagement score from frame history.
    
    Request:
        {
            "frames": [
                {"frame": "base64-image", "emotion": "happy", "confidence": 0.9, "attention": 85},
                ...
            ]
        }
    
    Response:
        {
            "engagementScore": 81,
            "state": "ENGAGED",
            "emotionScore": 85,
            "attentionScore": 80
        }
    """
    try:
        data = request.get_json()
        
        if not data or 'frames' not in data:
            return jsonify({'error': 'No frames provided'}), 400
        
        frames = data['frames']
        
        if not frames:
            return jsonify({'error': 'Empty frames array'}), 400
        
        # Extract emotion and attention data
        emotion_history = []
        attention_history = []
        
        for frame_data in frames:
            emotion_history.append({
                'emotion': frame_data.get('emotion', 'Neutral'),
                'confidence': frame_data.get('confidence', 0.5),
                'emotionProbabilities': frame_data.get('emotionProbabilities', {})
            })
            attention_history.append({
                'attention': frame_data.get('attention', 50),
                'eyesDetected': frame_data.get('eyesDetected', True),
                'blinkDetected': frame_data.get('blinkDetected', False),
                'lookingForward': frame_data.get('lookingForward', True)
            })
        
        # Calculate engagement score
        engagement_scorer = get_engagement_scorer()
        engagement_metrics = engagement_scorer.calculate_engagement_from_history(
            emotion_history, attention_history
        )
        
        # Classify state
        state_classifier = get_state_classifier()
        if emotion_history:
            state_result = state_classifier.classify(
                engagement_metrics['averageEngagement'],
                emotion_history[-1]['emotion']
            )
        else:
            state_result = state_classifier.classify(engagement_metrics['averageEngagement'])
        
        response = {
            'engagementScore': engagement_metrics['averageEngagement'],
            'state': state_result['state'],
            'stateDescription': state_result['description'],
            'emotionScore': engagement_metrics.get('emotionScore', 0),
            'attentionScore': engagement_metrics.get('attentionScore', 0),
            'highestEngagement': engagement_metrics['highestEngagement'],
            'lowestEngagement': engagement_metrics['lowestEngagement'],
            'engagementTrend': engagement_metrics['engagementTrend']
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
