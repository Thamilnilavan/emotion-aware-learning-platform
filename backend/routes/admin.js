const express = require('express');
const crypto = require('crypto');
const axios = require('axios');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const { Parser } = require('json2csv');
const User = require('../models/User');
const Session = require('../models/Session');
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

    try {
      const start = Date.now();
      await axios.get(`${process.env.AI_GATEWAY_URL}/health`, { timeout: 5000 });
      aiGatewayResponseTime = Date.now() - start;
      aiGatewayStatus = 'online';
    } catch (error) {
      aiGatewayStatus = 'offline';
    }

    try {
      const statusResponse = await axios.get(`${process.env.AI_GATEWAY_URL}/api/service-status`, { timeout: 5000 });
      servicesStatus = statusResponse.data;
    } catch (error) {
      servicesStatus = { error: 'Could not fetch service status' };
    }

    // Get prediction count from sessions
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPredictions = await Session.countDocuments({
      createdAt: { $gte: today }
    });

    return res.json({
      success: true,
      aiGateway: {
        status: aiGatewayStatus,
        responseTime: aiGatewayResponseTime,
      },
      services: servicesStatus,
      predictions: {
        today: todayPredictions,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/datasets', async (req, res) => {
  try {
    let datasetsStatus = {};
    
    try {
      const response = await axios.get(`${process.env.AI_GATEWAY_URL}/api/datasets/status`, { timeout: 5000 });
      datasetsStatus = response.data;
    } catch (error) {
      datasetsStatus = { error: 'Could not fetch dataset status' };
    }

    return res.json({
      success: true,
      datasets: datasetsStatus,
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
    // This would typically fetch from a notifications collection
    // For now, return system-generated notifications
    const notifications = [
      {
        id: '1',
        type: 'system',
        title: 'System Update',
        message: 'AI services have been updated to version 2.0',
        createdAt: new Date().toISOString(),
        read: false,
      },
    ];

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
    const { title, message, type } = req.body;
    
    // This would typically save to a notifications collection
    const notification = {
      id: Date.now().toString(),
      type: type || 'system',
      title,
      message,
      createdAt: new Date().toISOString(),
      read: false,
    };

    return res.json({
      success: true,
      notification,
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
    
    // Data deletion requests (would need a separate collection)
    const deletionRequests = [];

    return res.json({
      success: true,
      privacy: {
        totalUsers,
        activeUsers,
        totalSessions,
        deletionRequests,
        dataRetentionDays: process.env.DATA_RETENTION_DAYS || 180,
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
    
    // This would create a data deletion request
    const request = {
      id: Date.now().toString(),
      userId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    return res.json({
      success: true,
      request,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/settings', async (req, res) => {
  try {
    const settings = {
      general: {
        siteName: process.env.SITE_NAME || 'EmoLearn',
        supportEmail: process.env.SUPPORT_EMAIL || 'support@emolearn.com',
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
    
    // This would update environment variables or database settings
    // For now, just return success
    return res.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
