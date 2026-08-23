const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

const signToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

const formatUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  icbtNumber: user.icbtNumber,
  programme: user.programme,
  consent: user.consent,
  preferences: user.preferences,
  isActive: user.isActive,
  lastLogin: user.lastLogin,
  enrolledCourses: user.enrolledCourses,
  createdAt: user.createdAt,
});

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['student', 'teacher', 'admin']).withMessage('Invalid role'),
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

      const token = signToken(user);
      return res.status(201).json({
        success: true,
        token,
        user: formatUser(user),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/login',
  [
    body('email').notEmpty().withMessage('Email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const user = await User.findByEmail(req.body.email.toLowerCase());
      if (!user) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const match = await user.comparePassword(req.body.password);
      if (!match) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      if (!user.isActive) {
        return res.status(403).json({ success: false, message: 'Account deactivated' });
      }

      user.lastLogin = Date.now();
      await user.save();

      const token = signToken(user);
      return res.status(200).json({
        success: true,
        token,
        user: formatUser(user),
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/consent', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { webcamConsent, emotionConsent, attentionConsent, retentionConsent } = req.body;
    if (webcamConsent !== undefined) user.consent.webcamConsent = webcamConsent;
    if (emotionConsent !== undefined) user.consent.emotionConsent = emotionConsent;
    if (attentionConsent !== undefined) user.consent.attentionConsent = attentionConsent;
    if (retentionConsent !== undefined) user.consent.retentionConsent = retentionConsent;

    const previouslyGiven = user.consent.given;
    const allRequiredConsentGiven = Boolean(
      user.consent.webcamConsent &&
      user.consent.emotionConsent &&
      user.consent.attentionConsent &&
      user.consent.retentionConsent
    );

    // Recompute the aggregate flag on every update. This allows a learner to
    // revoke any consent option instead of leaving an old `given: true` value.
    user.consent.given = allRequiredConsentGiven;
    if (allRequiredConsentGiven && !previouslyGiven) {
      user.consent.givenAt = Date.now();
    } else if (!allRequiredConsentGiven) {
      user.consent.givenAt = undefined;
    }

    await user.save();
    return res.json({ success: true, user: formatUser(user) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/preferences', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { notificationSensitivity, darkMode, focusGoal } = req.body;
    if (notificationSensitivity !== undefined) {
      if (!['low', 'medium', 'high'].includes(notificationSensitivity)) {
        return res.status(400).json({ success: false, message: 'Invalid sensitivity value' });
      }
      user.preferences.notificationSensitivity = notificationSensitivity;
    }
    if (darkMode !== undefined) user.preferences.darkMode = darkMode;
    if (focusGoal !== undefined) user.preferences.focusGoal = focusGoal;

    await user.save();
    return res.json({ success: true, preferences: user.preferences });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/data', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const result = await Session.deleteMany({ userId: req.user.id });
    const user = await User.findById(req.user.id).select('-password');
    user.consent = {
      given: false,
      givenAt: null,
      webcamConsent: false,
      emotionConsent: false,
      attentionConsent: false,
      retentionConsent: false,
    };
    await user.save();
    return res.json({
      success: true,
      message: 'All your data has been deleted',
      sessionsDeleted: result.deletedCount,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/notifications', verifyToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }

  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 20, 1), 100);
    const skip = (page - 1) * limit;

    const notifications = await Notification.find({ recipientId: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('senderId', 'name email')
      .maxTimeMS(5000)
      .lean();

    const [totalCount, unreadCount] = await Promise.all([
      Notification.countDocuments({ recipientId: req.user.id }),
      Notification.countDocuments({ recipientId: req.user.id, isRead: false }),
    ]);

    return res.json({ 
      success: true, 
      notifications,
      unreadCount,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount,
        limit
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/notifications/read', verifyToken, async (req, res) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({
      success: false,
      message: 'Database is temporarily unavailable. Please try again shortly.',
    });
  }

  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, isRead: false },
      { isRead: true }
    );
    return res.json({ success: true, updated: result.modifiedCount });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
