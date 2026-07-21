const mongoose = require('mongoose');

const EngagementWindowSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  score: { type: Number, min: 0, max: 100, required: true },
  state: {
    type: String,
    enum: ['ENGAGED', 'MILD_DISTRACTION', 'DISTRACTED', 'NEGATIVE_AFFECT', 'BREAK_NEEDED'],
    required: true,
  },
  dominantEmotion: { type: String, default: 'Neutral' },
  attentionScore: { type: Number, min: 0, max: 1, default: 0 },
  emotionValence: { type: Number, min: 0, max: 1, default: 0.6 },
  interactionScore: { type: Number, min: 0, max: 1, default: 0.5 },
  interventionFired: { type: Boolean, default: false },
  interventionType: { type: String, default: null },
  allEmotionScores: { type: Map, of: Number },
});

const SessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  durationSeconds: { type: Number, default: 0 },
  windows: [EngagementWindowSchema],
  status: {
    type: String,
    enum: ['active', 'completed', 'abandoned'],
    default: 'active',
  },
  consentVerified: { type: Boolean, default: false },
  summary: {
    averageScore: { type: Number, default: 0 },
    peakScore: { type: Number, default: 0 },
    lowestScore: { type: Number, default: 100 },
    peakFocusMinute: { type: String, default: '' },
    dominantEmotion: { type: String, default: 'Neutral' },
    totalDistractions: { type: Number, default: 0 },
    totalInterventions: { type: Number, default: 0 },
    focusPercentage: { type: Number, default: 0 },
    emotionDistribution: { type: Map, of: Number },
  },
});

SessionSchema.index({ userId: 1 });
SessionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Session', SessionSchema);
