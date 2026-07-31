const express = require('express');
const Session = require('../models/Session');
const Course = require('../models/Course');
const { verifyToken } = require('../middleware/auth');

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

    const session = new Session({
      userId: req.user.id,
      courseId: req.body.courseId || undefined,
      consentVerified: true,
      status: 'active',
    });
    await session.save();
    return res.json({ success: true, sessionId: session._id });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/:id/window', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Invalid session ID' });
    }
    
    const session = await Session.findById(req.params.id);
    if (!session || session.userId.toString() !== req.user.id) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ success: false, message: 'Session is not active' });
    }

    const window = {
      score: req.body.score,
      state: req.body.state,
      dominantEmotion: req.body.dominantEmotion,
      attentionScore: req.body.attentionScore,
      emotionValence: req.body.emotionValence,
      interactionScore: req.body.interactionScore,
      interventionFired: req.body.interventionFired || false,
      interventionType: req.body.interventionType || null,
    };

    if (req.body.allEmotionScores) {
      window.allEmotionScores = req.body.allEmotionScores;
    }

    session.windows.push(window);
    await session.save();
    return res.json({ success: true, windowCount: session.windows.length });
  } catch (err) {
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

      summary.totalInterventions = windows.filter((w) => w.interventionFired).length;

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

    console.log('Session ended successfully:', req.params.id);
    return res.json({ success: true, session: { ...session, endTime, durationSeconds, status: 'completed', summary } });
  } catch (err) {
    console.error('Session end error:', err);
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
