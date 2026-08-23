const express = require('express');
const crypto = require('crypto');
const os = require('os');
const axios = require('axios');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const User = require('../models/User');
const Session = require('../models/Session');
const EmotionPrediction = require('../models/EmotionPrediction');
const Notification = require('../models/Notification');
const SystemSetting = require('../models/SystemSetting');
const DeletionRequest = require('../models/DeletionRequest');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.use(verifyToken, requireRole('admin'));

router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      const search = req.query.search;
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const totalCount = await User.countDocuments(filter);
    const users = await User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('-password')
      .lean();

    return res.json({
      success: true,
      users,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post(
  '/users',
  [
    body('name').trim().notEmpty(),
    body('email').isEmail(),
    body('password').isLength({ min: 8 }),
    body('role').isIn(['student', 'teacher', 'admin']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const existing = await User.findOne({ email: req.body.email.toLowerCase() });
      if (existing) {
        return res.status(409).json({ success: false, message: 'Email already registered' });
      }

      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        icbtNumber: req.body.icbtNumber,
        programme: req.body.programme,
      });
      await user.save();

      const safe = user.toSafeObject();
      return res.status(201).json({ success: true, user: safe });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.put('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    if (req.body.role !== undefined && !['student', 'teacher', 'admin'].includes(req.body.role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    if (String(req.params.id) === String(req.user.id) && req.body.isActive === false) {
      return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.isActive !== undefined) user.isActive = req.body.isActive;
    if (req.body.name !== undefined) user.name = req.body.name;

    await user.save();
    return res.json({ success: true, user: user.toSafeObject() });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/users/:id', async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: 'Invalid user id' });
    if (String(req.params.id) === String(req.user.id)) return res.status(400).json({ success: false, message: 'You cannot deactivate your own account' });
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.isActive = false;
    await user.save();
    return res.json({ success: true, message: 'User deactivated' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const sessions = await Session.find({ status: 'completed' }).lean();

    const rows = sessions.map((s) => ({
      anonymised_id: crypto.createHash('md5').update(s.userId.toString()).digest('hex'),
      session_date: s.endTime ? new Date(s.endTime).toISOString() : '',
      duration_seconds: s.durationSeconds || 0,
      average_score: s.summary?.averageScore || 0,
      peak_score: s.summary?.peakScore || 0,
      dominant_emotion: s.summary?.dominantEmotion || 'Neutral',
      total_distractions: s.summary?.totalDistractions || 0,
      focus_percentage: s.summary?.focusPercentage || 0,
      total_interventions: s.summary?.totalInterventions || 0,
    }));

    const parser = new Parser();
    const csv = parser.parse(rows);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=anonymised_sessions.csv');
    return res.send(csv);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/system', async (req, res) => {
  try {
    const database =
      mongoose.connection.readyState === 1 ? 'connected' : 'error';

    let aiService = 'offline';
    let aiGateway = 'offline';
    try {
      await axios.get(`${process.env.AI_SERVICE_URL}/health`, { timeout: 3000 });
      aiService = 'online';
    } catch {
      aiService = 'offline';
    }
    
    try {
      await axios.get(`${process.env.AI_GATEWAY_URL}/health`, { timeout: 3000 });
      aiGateway = 'online';
    } catch {
      aiGateway = 'offline';
    }

    // Get system metrics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalSessions = await Session.countDocuments();
    const activeSessions = await Session.countDocuments({ status: 'active' });

    return res.json({
      success: true,
      database,
      aiService,
      aiGateway,
      metrics: {
        totalUsers,
        activeUsers,
        totalSessions,
        activeSessions,
        memoryUsagePercent: Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100),
        systemLoadPercent: Math.min(100, Math.round((os.loadavg()[0] / Math.max(os.cpus().length, 1)) * 100)),
        uptimeSeconds: Math.round(process.uptime()),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/dashboard', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const activeSessions = await Session.countDocuments({ status: 'active' });
    
    // Calculate average engagement
    const completedSessions = await Session.find({ status: 'completed' }).lean();
    const avgEngagement = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / completedSessions.length
      : 0;

    // Emotion distribution
    const emotionDistribution = {};
    completedSessions.forEach(session => {
      const emotion = session.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });

    return res.json({
      success: true,
      metrics: {
        totalUsers,
        totalTeachers,
        totalStudents,
        activeSessions,
        avgEngagement: Math.round(avgEngagement),
        emotionDistribution,
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/analytics', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const sessions = await Session.find({
      createdAt: { $gte: startDate }
    }).lean();

    // Daily engagement trends
    const dailyData = {};
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      dailyData[dateStr] = {
        sessions: 0,
        avgEngagement: 0,
        totalDistractions: 0,
      };
    }

    sessions.forEach(session => {
      const dateStr = new Date(session.createdAt).toISOString().split('T')[0];
      if (dailyData[dateStr]) {
        dailyData[dateStr].sessions++;
        dailyData[dateStr].avgEngagement += session.summary?.averageScore || 0;
        dailyData[dateStr].totalDistractions += session.summary?.totalDistractions || 0;
      }
    });

    // Calculate averages
    Object.keys(dailyData).forEach(date => {
      const data = dailyData[date];
      if (data.sessions > 0) {
        data.avgEngagement = Math.round(data.avgEngagement / data.sessions);
      }
    });

    return res.json({
      success: true,
      timeRange,
      dailyData: Object.entries(dailyData).map(([date, data]) => ({
        date,
        ...data,
      })),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/ai-monitoring', async (req, res) => {
  try {
    let aiGatewayStatus = 'offline';
    let aiGatewayResponseTime = null;
    let servicesStatus = {};
    let model = null;
    // Use the same gateway as live frame analysis. AI_SERVICE_URL is retained
    // only as a backwards-compatible fallback.
    const aiBaseUrl = process.env.AI_GATEWAY_URL || process.env.AI_SERVICE_URL || 'http://localhost:5000';

    try {
      const start = Date.now();
      const health = await axios.get(`${aiBaseUrl}/health`, { timeout: 5000 });
      aiGatewayResponseTime = Date.now() - start;
      aiGatewayStatus = 'online';
      servicesStatus = health.data;
    } catch (error) {
      aiGatewayStatus = 'offline';
    }

    try {
      const statusResponse = await axios.get(`${aiBaseUrl}/model/info`, { timeout: 5000 });
      model = statusResponse.data;
    } catch (error) {
      model = null;
    }

    // Read actual frame predictions rather than treating sessions as predictions.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayPredictions, latestPrediction] = await Promise.all([
      EmotionPrediction.countDocuments({ timestamp: { $gte: today } }),
      EmotionPrediction.findOne()
        .sort({ timestamp: -1 })
        .populate('user_id', 'name')
        .lean(),
    ]);
    const latestTimestamp = latestPrediction?.timestamp
      ? new Date(latestPrediction.timestamp).getTime()
      : 0;
    const isLive = latestTimestamp > 0 && Date.now() - latestTimestamp <= 15000;

    return res.json({
      success: true,
      aiGateway: {
        status: aiGatewayStatus,
        responseTime: aiGatewayResponseTime,
      },
      services: servicesStatus,
      model,
      predictions: {
        today: todayPredictions,
        latest: latestPrediction ? {
          emotion: latestPrediction.emotion,
          confidence: latestPrediction.emotion_confidence,
          faceDetected: latestPrediction.face_detected,
          timestamp: latestPrediction.timestamp,
          studentName: latestPrediction.user_id?.name || 'Student',
        } : null,
        isLive,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/datasets', async (req, res) => {
  try {
    let model = null;
    const aiBaseUrl = process.env.AI_SERVICE_URL || process.env.AI_GATEWAY_URL || 'http://localhost:5000';
    try {
      const response = await axios.get(`${aiBaseUrl}/model/info`, { timeout: 5000 });
      model = response.data;
    } catch (error) {
      model = null;
    }

    return res.json({
      success: true,
      datasets: [{ name: 'RAF-DB', purpose: 'Facial-expression model training', classes: 7, status: model ? 'available' : 'configured' }],
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/research', async (req, res) => {
  try {
    const completedSessions = await Session.find({ status: 'completed' }).lean();
    
    // Calculate research metrics
    const totalSessions = completedSessions.length;
    const avgEngagement = totalSessions > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / totalSessions
      : 0;
    
    // Emotion accuracy (simplified - would need ground truth for real accuracy)
    const emotionDistribution = {};
    completedSessions.forEach(session => {
      const emotion = session.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });

    // Focus metrics
    const avgFocusPercentage = totalSessions > 0
      ? completedSessions.reduce((sum, s) => sum + (s.summary?.focusPercentage || 0), 0) / totalSessions
      : 0;

    return res.json({
      success: true,
      metrics: {
        totalSessions,
        avgEngagement: Math.round(avgEngagement),
        emotionDistribution,
        avgFocusPercentage: Math.round(avgFocusPercentage),
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({ senderId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('recipientId', 'name email role')
      .lean();

    return res.json({
      success: true,
      notifications,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/notifications', async (req, res) => {
  try {
    const { title, message, targetRole } = req.body;
    if (!String(title || '').trim() || !String(message || '').trim()) {
      return res.status(400).json({ success: false, message: 'Title and message are required' });
    }
    const filter = targetRole && ['student', 'teacher', 'admin'].includes(targetRole)
      ? { role: targetRole, isActive: true, _id: { $ne: req.user.id } }
      : { isActive: true, _id: { $ne: req.user.id } };
    const recipients = await User.find(filter).select('_id');
    const documents = recipients.map((user) => ({
      recipientId: user._id,
      senderId: req.user.id,
      type: 'system',
      title: String(title).trim(),
      message: String(message).trim(),
      metadata: { targetRole: targetRole || 'all' },
    }));
    const notifications = documents.length ? await Notification.insertMany(documents) : [];

    return res.json({
      success: true,
      delivered: notifications.length,
      notification: notifications[0] || null,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/privacy', async (req, res) => {
  try {
    // Get privacy-related statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const totalSessions = await Session.countDocuments();
    
    const deletionRequests = await DeletionRequest.find()
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('userId', 'name email role')
      .lean();
    const privacySetting = await SystemSetting.findOne({ key: 'privacy' }).lean();

    return res.json({
      success: true,
      privacy: {
        totalUsers,
        activeUsers,
        totalSessions,
        deletionRequests,
        dataRetentionDays: privacySetting?.value?.dataRetentionDays || Number(process.env.DATA_RETENTION_DAYS) || 180,
        webcamDataStored: false, // Never stored
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/privacy/delete-request', async (req, res) => {
  try {
    const { userId, reason } = req.body;
    if (!mongoose.isValidObjectId(userId) || !String(reason || '').trim()) {
      return res.status(400).json({ success: false, message: 'A valid user and reason are required' });
    }
    const user = await User.findById(userId).select('_id');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const existing = await DeletionRequest.findOne({ userId, status: 'pending' });
    if (existing) return res.status(409).json({ success: false, message: 'A pending request already exists for this user' });
    const request = await DeletionRequest.create({
      userId,
      requestedBy: req.user.id,
      reason: String(reason).trim(),
    });

    return res.json({
      success: true,
      request,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/privacy/delete-request/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid request status' });
    }
    const request = await DeletionRequest.findByIdAndUpdate(
      req.params.id,
      { status, reviewedAt: new Date(), reviewedBy: req.user.id },
      { new: true }
    );
    if (!request) return res.status(404).json({ success: false, message: 'Deletion request not found' });
    return res.json({ success: true, request });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const defaults = {
      general: {
        siteName: process.env.SITE_NAME || 'Eduvo',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@eduvo.app',
      },
      ai: {
        confidenceThreshold: process.env.CONFIDENCE_THRESHOLD || 0.55,
        engagementThreshold: process.env.ENGAGEMENT_THRESHOLD || 0.7,
        aiGatewayUrl: process.env.AI_GATEWAY_URL || 'http://localhost:5000',
      },
      privacy: {
        dataRetentionDays: process.env.DATA_RETENTION_DAYS || 180,
        anonymizeData: true,
      },
    };

    const stored = await SystemSetting.find({ key: { $in: ['general', 'ai', 'privacy'] } }).lean();
    const settings = stored.reduce((result, item) => {
      result[item.key] = { ...result[item.key], ...item.value };
      return result;
    }, defaults);
    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/settings', async (req, res) => {
  try {
    const { section, settings } = req.body;
    if (!['general', 'ai', 'privacy'].includes(section) || !settings || typeof settings !== 'object') {
      return res.status(400).json({ success: false, message: 'A valid settings section is required' });
    }
    const allowed = {
      general: ['siteName', 'supportEmail'],
      ai: ['confidenceThreshold', 'engagementThreshold', 'aiGatewayUrl'],
      privacy: ['dataRetentionDays', 'anonymizeData'],
    }[section];
    const clean = Object.fromEntries(Object.entries(settings).filter(([key]) => allowed.includes(key)));
    const saved = await SystemSetting.findOneAndUpdate(
      { key: section },
      { value: clean, updatedBy: req.user.id, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json({
      success: true,
      message: 'Settings updated successfully',
      settings: saved.value,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
