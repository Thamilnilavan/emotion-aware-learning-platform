"""
Main Flask application for AI Service
Emotion-Aware Adaptive Learning Platform
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
import config
from utils.logger import setup_logger
from routes.analyse import analyse_bp
from routes.score import score_bp
from routes.intervention import intervention_bp
from routes.health import health_bp

# Initialize Flask app
app = Flask(__name__)

# Setup CORS
CORS(app, origins=config.CORS_ORIGINS)

# Setup logger
logger = setup_logger('ai_service', log_file='logs/ai_service.log')

# Register blueprints
app.register_blueprint(analyse_bp)
app.register_blueprint(score_bp)
app.register_blueprint(intervention_bp)
app.register_blueprint(health_bp)


@app.route('/', methods=['GET'])
def index():
    """Root endpoint"""
    return jsonify({
        'service': 'AI Service',
        'version': '1.0.0',
        'status': 'running',
        'endpoints': {
            'analyse': '/ai/analyse',
            'score': '/ai/score',
            'intervention': '/ai/intervention',
            'health': '/ai/health',
            'model-metrics': '/ai/model-metrics'
        }
    }), 200


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors"""
    return jsonify({'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle 500 errors"""
    logger.error(f"Internal server error: {error}")
    return jsonify({'error': 'Internal server error'}), 500


if __name__ == '__main__':
    logger.info("Starting AI Service...")
    logger.info(f"Host: {config.FLASK_HOST}")
    logger.info(f"Port: {config.FLASK_PORT}")
    logger.info(f"Debug: {config.FLASK_DEBUG}")
    
    app.run(
        host=config.FLASK_HOST,
        port=config.FLASK_PORT,
        debug=config.FLASK_DEBUG
    )
