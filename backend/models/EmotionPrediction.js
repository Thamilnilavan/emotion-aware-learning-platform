const mongoose = require('mongoose');

const emotionPredictionSchema = new mongoose.Schema({
  session_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  emotion: {
    type: String,
    enum: ['happy', 'sad', 'angry', 'neutral', 'surprised', 'fearful', 'disgusted'],
    required: true
  },
  emotion_confidence: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  attention: {
    type: Number,
    min: 0,
    max: 100,
    required: true
  },
  face_detected: {
    type: Boolean,
    default: true
  },
  fatigue_level: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  probabilities: {
    type: Map,
    of: Number,
    default: {}
  },
  image_data: {
    type: String, // Base64 encoded image (optional)
    required: false
  }
}, {
  timestamps: true
});

// Index for faster queries
emotionPredictionSchema.index({ session_id: 1, timestamp: 1 });
emotionPredictionSchema.index({ user_id: 1, timestamp: 1 });
emotionPredictionSchema.index({ emotion: 1 });

module.exports = mongoose.model('EmotionPrediction', emotionPredictionSchema);
