const express = require('express');
const mongoose = require('mongoose');
const Session = require('../models/Session');
const Course = require('../models/Course');
const { verifyToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { AppError, ErrorCodes } = require('../utils/errorCodes');
const Notification = require('../models/Notification');
const User = require('../models/User');

const router = express.Router();

router.use(verifyToken);

const verifySessionAccess = async (session, user) => {
  if (session.userId.toString() === user.id) return true;
  if (user.role === 'admin') return true;
  if (user.role === 'teacher') {
    const courses = await Course.find({ teacherId: user.id }).select('enrolledStudents');
    for (const course of courses) {
      if (course.enrolledStudents.some((s) => s.toString() === session.userId.toString())) {
        return true;
      }
    }
  }
  return false;
};

router.post('/start', async (req, res) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user.consent.given) {
      return res.status(403).json({
        success: false,
        message: 'Consent required before starting a session',
      });
    }

    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: 'Only students can start learning sessions' });
    }

    const { courseId } = req.body;
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ success: false, message: 'A valid course ID is required' });
    }

    const course = await Course.findOne({ _id: courseId, isActive: true }).select('enrolledStudents');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const enrolledOnCourse = course.enrolledStudents.some((id) => id.toString() === req.user.id);
    const enrolledOnUser = (user.enrolledCourses || []).some((id) => id.toString() === courseId);
    if (!enrolledOnCourse && !enrolledOnUser) {
      return res.status(403).json({ success: false, message: 'You must enrol in this course before starting a session' });
    }

    // Make session creation idempotent. This also protects against duplicate
    // requests caused by retries or React Strict Mode in development.
    const existingSession = await Session.findOne({
      userId: req.user.id,
      courseId,
      status: 'active',
    }).sort({ startTime: -1 });
    if (existingSession) {
      return res.json({
        success: true,
        sessionId: existingSession._id,
        reused: true,
        overallProgress: existingSession.overallProgress || 0,
        contentProgress: existingSession.contentProgress || [],
        notes: existingSession.notes || '',
      });
    }

    const session = new Session({
      userId: req.user.id,
      courseId,
      consentVerified: true,
      status: 'active',
    });
    await session.save();
    return res.json({
      success: true,
      sessionId: session._id,
      reused: false,
      overallProgress: 0,
      contentProgress: [],
      notes: '',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/window', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid session ID' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'active') {
      // A final AI calculation may finish just after the learner closes the
      // session. Treat that late result as safely ignored, not as an error.
      return res.json({ success: true, ignored: true, reason: 'session_completed' });
    }

    const score = Number(req.body.score);
    const attentionScore = Number(req.body.attentionScore);
    const emotionValence = Number(req.body.emotionValence);
    const interactionScore = Number(req.body.interactionScore);
    const fatigueScore = Number(req.body.fatigueScore || 0);
    const validStates = ['ENGAGED', 'MILD_DISTRACTION', 'DISTRACTED', 'NEGATIVE_AFFECT', 'BREAK_NEEDED'];

    if (!Number.isFinite(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'Score must be between 0 and 100' });
    }
    if (!validStates.includes(req.body.state)) {
      return res.status(400).json({ success: false, message: 'Invalid engagement state' });
    }
    for (const [name, value] of Object.entries({ attentionScore, emotionValence, interactionScore, fatigueScore })) {
      if (!Number.isFinite(value) || value < 0 || value > 1) {
        return res.status(400).json({ success: false, message: `${name} must be between 0 and 1` });
      }
    }

    const window = {
      score,
      state: req.body.state,
      dominantEmotion: req.body.dominantEmotion,
      attentionScore,
      emotionValence,
      interactionScore,
      fatigueScore,
      interventionFired: req.body.interventionFired || false,
      interventionType: req.body.interventionType || null,
    };

    if (req.body.allEmotionScores) {
      window.allEmotionScores = req.body.allEmotionScores;
    }

    session.windows.push(window);
    await session.save();

    const course = await Course.findById(session.courseId).select('teacherId title settings');
    const threshold = Number(course?.settings?.engagementThreshold ?? 45);
    if (course?.teacherId && score < threshold) {
      const cooldownSeconds = { low: 900, medium: 300, high: 60 }[course.settings?.alertFrequency || 'medium'];
      const duplicate = await Notification.exists({
        recipientId: course.teacherId,
        sessionId: session._id,
        type: 'warning',
        createdAt: { $gte: new Date(Date.now() - cooldownSeconds * 1000) },
      });
      if (!duplicate) {
        const student = await User.findById(req.user.id).select('name');
        await Notification.create({
          recipientId: course.teacherId,
          type: 'warning',
          title: 'Low engagement alert',
          message: `${student?.name || 'A student'} recorded ${Math.round(score)}% engagement in ${course.title}.`,
          sessionId: session._id,
          metadata: { score, state: req.body.state, courseId: course._id },
        });
      }
    }
    return res.json({ success: true, windowCount: session.windows.length });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/notes', async (req, res) => {
  try {
    const notes = typeof req.body.notes === 'string' ? req.body.notes.trim() : '';
    if (notes.length > 20000) {
      return res.status(400).json({ success: false, message: 'Notes cannot exceed 20,000 characters' });
    }
    const session = await Session.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id, status: { $in: ['active', 'completed'] } },
      { notes },
      { new: true }
    ).select('notes');
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });
    return res.json({ success: true, notes: session.notes });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/interventions', async (req, res) => {
  try {
    const validTypes = ['NUDGE', 'ALERT', 'PAUSE', 'SUPPORT', 'BREAK'];
    const type = String(req.body.type || '').toUpperCase();
    const score = Number(req.body.score);
    if (!validTypes.includes(type) || !Number.isFinite(score) || score < 0 || score > 100) {
      return res.status(400).json({ success: false, message: 'Valid intervention type and score are required' });
    }
    const session = await Session.findOne({ _id: req.params.id, userId: req.user.id, status: 'active' });
    if (!session) return res.status(404).json({ success: false, message: 'Active session not found' });
    session.interventions.push({
      type,
      message: String(req.body.message || ''),
      state: String(req.body.state || 'UNKNOWN'),
      score,
    });
    await session.save();
    return res.json({ success: true, intervention: session.interventions.at(-1) });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/progress', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      throw new AppError(ErrorCodes.INVALID_ID);
    }

    const session = await Session.findOne({
      _id: req.params.id,
      userId: req.user.id,
      status: { $in: ['active', 'completed'] },
    });
    if (!session) {
      throw new AppError(ErrorCodes.SESSION_NOT_FOUND);
    }

    const contentIndex = Number(req.body.contentIndex);
    const positionSeconds = Math.max(0, Number(req.body.positionSeconds) || 0);
    const durationSeconds = Math.max(0, Number(req.body.durationSeconds) || 0);
    const suppliedPercent = Number(req.body.percent);
    const calculatedPercent = durationSeconds > 0
      ? (positionSeconds / durationSeconds) * 100
      : suppliedPercent;
    const percent = Math.min(100, Math.max(0, Number.isFinite(calculatedPercent) ? calculatedPercent : 0));

    if (!Number.isInteger(contentIndex) || contentIndex < 0) {
      throw new AppError(ErrorCodes.INVALID_INPUT);
    }

    const course = await Course.findById(session.courseId).select('content');
    if (!course || contentIndex >= course.content.length) {
      throw new AppError(ErrorCodes.RESOURCE_NOT_FOUND);
    }

    const existing = session.contentProgress.find((item) => item.contentIndex === contentIndex);
    if (existing) {
      // Never reduce recorded progress when the learner replays or seeks back.
      if (percent >= existing.percent) {
        existing.positionSeconds = positionSeconds;
        existing.durationSeconds = durationSeconds;
        existing.percent = Math.round(percent * 10) / 10;
        existing.completed = percent >= 90;
      }
      existing.updatedAt = new Date();
    } else {
      session.contentProgress.push({
        contentIndex,
        positionSeconds,
        durationSeconds,
        percent: Math.round(percent * 10) / 10,
        completed: percent >= 90,
        updatedAt: new Date(),
      });
    }

    const totalItems = course.content.length || 1;
    const totalPercent = session.contentProgress.reduce((sum, item) => sum + item.percent, 0);
    session.overallProgress = Math.round((totalPercent / totalItems) * 10) / 10;
    session.durationSeconds = Math.round((Date.now() - session.startTime) / 1000);
    await session.save();

    return res.json({
      success: true,
      contentIndex,
      contentProgress: Math.round(percent * 10) / 10,
      overallProgress: session.overallProgress,
    });
  } catch (err) {
    if (err instanceof AppError) {
      return res.status(400).json(err.toJSON());
    }
    logger.error('Progress update error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/end', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid session ID' });
    }

    const session = await Session.findById(req.params.id).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.userId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Ending a session is idempotent. Repeated UI events return the existing
    // completed record without recalculating or extending its duration.
    if (session.status === 'completed') {
      return res.json({ success: true, session });
    }

    const endTime = Date.now();
    const durationSeconds = Math.round((endTime - session.startTime) / 1000);

    const windows = session.windows || [];
    let summary = {
      averageScore: 0,
      peakScore: 0,
      lowestScore: 0,
      peakFocusMinute: '0 min',
      dominantEmotion: 'Neutral',
      totalDistractions: 0,
      totalInterventions: 0,
      focusPercentage: 0,
      emotionDistribution: {},
    };

    if (windows.length > 0) {
      const scores = windows.map((w) => w.score);
      summary.averageScore = Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
      summary.peakScore = Math.max(...scores);
      summary.lowestScore = Math.min(...scores);

      const peakIdx = scores.indexOf(summary.peakScore);
      summary.peakFocusMinute = `${peakIdx * 0.5} min`;

      const emotionCounts = {};
      windows.forEach((w) => {
        emotionCounts[w.dominantEmotion] = (emotionCounts[w.dominantEmotion] || 0) + 1;
      });
      summary.dominantEmotion = Object.entries(emotionCounts).sort((a, b) => b[1] - a[1])[0][0];
      summary.emotionDistribution = emotionCounts;

      summary.totalDistractions = windows.filter(
        (w) => w.state === 'DISTRACTED' || w.state === 'BREAK_NEEDED'
      ).length;

      summary.totalInterventions = (session.interventions || []).length || windows.filter((w) => w.interventionFired).length;

      const focused = windows.filter(
        (w) => w.state === 'ENGAGED' || w.state === 'MILD_DISTRACTION'
      ).length;
      summary.focusPercentage = Math.round((focused / windows.length) * 100);
    }

    await Session.findByIdAndUpdate(req.params.id, {
      endTime,
      durationSeconds,
      status: 'completed',
      summary,
    });

    logger.info('Session ended successfully:', req.params.id);
    return res.json({ success: true, session: { ...session, endTime, durationSeconds, status: 'completed', summary } });
  } catch (err) {
    logger.error('Session end error:', err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id, status: 'completed' };
    const totalCount = await Session.countDocuments(filter);
    const sessions = await Session.find(filter)
      .sort({ endTime: -1 })
      .skip(skip)
      .limit(limit)
      .select('-windows')
      .populate('courseId', 'title')
      .lean();

    return res.json({
      success: true,
      sessions,
      totalCount,
      currentPage: page,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id/report', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('courseId', 'title');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const hasAccess = await verifySessionAccess(session, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const insights = [];
    if (session.summary.averageScore < 50) {
      insights.push('Consider shorter study sessions of 20-25 minutes to maintain focus.');
    }
    if (session.summary.totalDistractions > 5) {
      insights.push('Try using a break timer — frequent short breaks may help reduce distractions.');
    }
    const peakMinute = parseFloat(session.summary.peakFocusMinute) || 0;
    if (peakMinute < 10) {
      insights.push('You tend to start strong — leverage that early focus for challenging material first.');
    }
    if (insights.length === 0) {
      insights.push('Great session! Keep maintaining your current study habits.');
      insights.push('Review your emotion patterns to identify your optimal learning times.');
      insights.push('Stay consistent with your study schedule for best results.');
    }

    return res.json({ success: true, session, insights });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const session = await Session.findById(req.params.id).populate('courseId', 'title');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    const hasAccess = await verifySessionAccess(session, req.user);
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const full = req.query.full === 'true';
    if (full) {
      return res.json({ success: true, session });
    }

    const summaryOnly = {
      _id: session._id,
      userId: session.userId,
      courseId: session.courseId,
      startTime: session.startTime,
      endTime: session.endTime,
      durationSeconds: session.durationSeconds,
      status: session.status,
      summary: session.summary,
    };
    return res.json({ success: true, session: summaryOnly });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
