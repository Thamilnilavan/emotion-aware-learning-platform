const express = require('express');
const axios = require('axios');
const mongoose = require('mongoose');
const { verifyToken } = require('../middleware/auth');
const EmotionPrediction = require('../models/EmotionPrediction');
const Session = require('../models/Session');
const { calculateEngagement } = require('../utils/engagement');
const logger = require('../utils/logger');

const router = express.Router();
const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:5000';
const AI_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS) || 15000;
const AI_API_KEY = process.env.AI_API_KEY;

// Verify AI service API key for internal service-to-service communication
const verifyAIKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
  
  // Skip verification if no API key is configured (development mode)
  if (!AI_API_KEY) {
    return next();
  }
  
  if (!apiKey || apiKey !== AI_API_KEY) {
    logger.warn('Unauthorized AI service access attempt');
    return res.status(401).json({ success: false, message: 'Unauthorized AI service access' });
  }
  
  next();
};

router.use(verifyToken);

const normalizeEmotion = (emotion) => String(emotion || 'neutral').toLowerCase();
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

async function predictImage(image) {
  const response = await axios.post(
    `${AI_GATEWAY_URL}/predict`,
    { image },
    { timeout: AI_TIMEOUT_MS }
  );
  return response.data;
}

router.post('/analyze-frame', async (req, res) => {
  const { image, session_id: sessionId, timestamp } = req.body;
  if (!image) {
    return res.status(400).json({ success: false, message: 'Image data is required' });
  }

  try {
    let session = null;
    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return res.status(400).json({ success: false, message: 'Invalid session ID' });
      }
      session = await Session.findOne({ _id: sessionId, userId: req.user.id, status: 'active' });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Active session not found' });
      }
    }

    const prediction = await predictImage(image);
    const confidence = clamp(Number(prediction.confidence) || 0, 0, 1);
    const attentionAvailable = prediction.available === true && Number.isFinite(Number(prediction.attention));
    const attention = attentionAvailable ? clamp(Number(prediction.attention), 0, 1) : null;
    const fatigueAvailable = prediction.available === true && Number.isFinite(Number(prediction.fatigue));
    const fatigue = fatigueAvailable ? clamp(Number(prediction.fatigue), 0, 1) : null;
    const result = {
      emotion: normalizeEmotion(prediction.emotion),
      emotion_confidence: confidence,
      attention,
      attention_available: attentionAvailable,
      yaw: Number.isFinite(Number(prediction.yaw)) ? Number(prediction.yaw) : null,
      pitch: Number.isFinite(Number(prediction.pitch)) ? Number(prediction.pitch) : null,
      face_detected: true,
      fatigue_level: fatigue,
      fatigue_available: fatigueAvailable,
      timestamp: timestamp || Date.now(),
      probabilities: prediction.probabilities,
      class_id: prediction.class_id,
      color: prediction.color,
      description: prediction.description,
      demo_mode: false,
      source: 'model',
    };

    if (session) {
      await EmotionPrediction.create({
        session_id: session._id,
        user_id: req.user.id,
        emotion: result.emotion,
        emotion_confidence: result.emotion_confidence,
        attention: result.attention,
        face_detected: result.face_detected,
        fatigue_level: null,
        timestamp: new Date(result.timestamp),
        probabilities: result.probabilities,
      });
    }

    return res.json({ success: true, data: result });
  } catch (error) {
    const flaskStatus = error.response?.status;
    const flaskError = error.response?.data?.error;

    // No face in a particular frame is a valid analysis outcome, not a
    // service outage. Return a normal response and allow the next scan.
    if (flaskStatus === 400 && /no face/i.test(String(flaskError || ''))) {
      return res.json({
        success: true,
        data: {
          emotion: 'neutral',
          emotion_confidence: 0,
          attention: null,
          attention_available: false,
          face_detected: false,
          fatigue_level: null,
          fatigue_available: false,
          timestamp: timestamp || Date.now(),
          demo_mode: false,
          source: 'model',
        },
      });
    }

    logger.error('AI frame analysis error:', {
      message: error.message,
      code: error.code,
      status: flaskStatus,
      flaskError,
    });
    return res.status(503).json({
      success: false,
      message: 'AI emotion analysis is temporarily unavailable',
      demo_mode: false,
    });
  }
});

router.post('/analyze-session', async (req, res) => {
  const { images } = req.body;
  if (!Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ success: false, message: 'A non-empty images array is required' });
  }
  try {
    const response = await axios.post(
      `${AI_GATEWAY_URL}/batch_predict`,
      { images },
      { timeout: Math.max(AI_TIMEOUT_MS, 30000) }
    );
    return res.json({ success: true, data: response.data });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Batch analysis unavailable' });
  }
});

router.get('/health', async (req, res) => {
  try {
    const response = await axios.get(`${AI_GATEWAY_URL}/health`, { timeout: AI_TIMEOUT_MS });
    return res.json({ success: true, data: response.data });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'AI service unavailable' });
  }
});

router.get('/status', async (req, res) => {
  try {
    const response = await axios.get(`${AI_GATEWAY_URL}/model/info`, { timeout: AI_TIMEOUT_MS });
    return res.json({ success: true, data: response.data });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'AI model information unavailable' });
  }
});

router.post('/detect-emotion', async (req, res) => {
  if (!req.body.image) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }
  try {
    const prediction = await predictImage(req.body.image);
    return res.json({ success: true, data: prediction });
  } catch (error) {
    return res.status(503).json({ success: false, message: 'Emotion detection unavailable' });
  }
});

// Face detection is part of the Flask preprocessing performed by /predict.
router.post('/detect-faces', async (req, res) => {
  if (!req.body.image) {
    return res.status(400).json({ success: false, message: 'Image is required' });
  }
  try {
    const prediction = await predictImage(req.body.image);
    return res.json({ success: true, data: { face_detected: true, prediction } });
  } catch (error) {
    const noFace = error.response?.status === 400;
    return res.status(noFace ? 200 : 503).json({
      success: noFace,
      data: noFace ? { face_detected: false } : undefined,
      message: noFace ? undefined : 'Face detection unavailable',
    });
  }
});

router.post('/calculate-engagement', (req, res) => {
  const { session_data: frames } = req.body;
  if (!Array.isArray(frames) || frames.length === 0) {
    return res.status(400).json({ success: false, message: 'Session data is required' });
  }
  return res.json({ success: true, data: calculateEngagement(frames) });
});

router.post('/generate-intervention', (req, res) => {
  const score = Number(req.body.engagement_score);
  const emotion = normalizeEmotion(req.body.emotion);
  let data = { type: null, message: null, pauseVideo: false };

  if (score < 20) data = { type: 'BREAK', message: 'Take a short break before continuing.', pauseVideo: true };
  else if (['angry', 'sad', 'fearful', 'disgusted'].includes(emotion)) {
    data = { type: 'SUPPORT', message: 'Would you like to review this section?', pauseVideo: false };
  } else if (score < 45) data = { type: 'ALERT', message: 'You seem distracted. Ready to continue?', pauseVideo: false };
  else if (score < 70) data = { type: 'NUDGE', message: 'Try to refocus on the current section.', pauseVideo: false };

  return res.json({ success: true, data });
});

module.exports = router;
