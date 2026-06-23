"""
Route for adaptive intervention recommendations
"""

from flask import Blueprint, request, jsonify
from engagement.intervention_rules import get_intervention_engine
from engagement.state_classifier import get_state_classifier
import config

intervention_bp = Blueprint('intervention', __name__)


@intervention_bp.route('/ai/intervention', methods=['POST'])
def get_intervention():
    """
    Get adaptive intervention recommendation.
    
    Request:
        {
            "state": "DISTRACTED",
            "engagementScore": 35,
            "emotion": "sad",
            "sessionDuration": 900
        }
    
    Response:
        {
            "type": "ALERT",
            "message": "You seem distracted.",
            "priority": "medium",
            "actionRequired": true,
            "details": {...}
        }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        state = data.get('state', 'ENGAGED')
        engagement_score = data.get('engagementScore', 70)
        emotion = data.get('emotion')
        session_duration = data.get('sessionDuration', 0)
        
        # Get intervention recommendation
        intervention_engine = get_intervention_engine()
        intervention = intervention_engine.determine_intervention(
            state, engagement_score, emotion, session_duration
        )
        
        # Get intervention details
        if intervention['type']:
            details = intervention_engine.get_intervention_details(intervention['type'])
            intervention['details'] = details
            
            # Record intervention
            intervention_engine.record_intervention(intervention)
        
        return jsonify(intervention), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@intervention_bp.route('/ai/intervention/stats', methods=['GET'])
def get_intervention_stats():
    """
    Get intervention statistics for current session.
    
    Response:
        {
            "totalInterventions": 5,
            "byType": {"ALERT": 2, "NUDGE": 2, "PAUSE": 1},
            "mostCommon": "ALERT"
        }
    """
    try:
        intervention_engine = get_intervention_engine()
        stats = intervention_engine.get_intervention_stats()
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@intervention_bp.route('/ai/intervention/reset', methods=['POST'])
def reset_intervention_session():
    """
    Reset intervention session state.
    
    Response:
        {
            "success": true
        }
    """
    try:
        intervention_engine = get_intervention_engine()
        intervention_engine.reset_session()
        
        return jsonify({'success': True}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
