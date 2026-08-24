const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Course = require('../models/Course');
const Session = require('../models/Session');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.use(verifyToken, requireRole('teacher', 'admin'));

const getTeacherStudentIds = async (teacherId) => {
  const courses = await Course.find({ teacherId }).select('enrolledStudents');
  return [...new Set(courses.flatMap((c) => (c.enrolledStudents || []).map(String)))];
};

const getTeacherCourseIds = async (teacherId) =>
  (await Course.find({ teacherId }).select('_id').lean()).map((course) => course._id);

const isStudentInTeacherCourses = async (teacherId, studentId) => {
  const courses = await Course.find({ teacherId, enrolledStudents: studentId });
  return courses.length > 0;
};

router.get('/students', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    const students = [];

    for (const sid of studentIds) {
      const student = await User.findById(sid).select('name email programme icbtNumber isActive');
      if (!student) continue;

      const latestSession = await Session.findOne({
        userId: sid,
        courseId: { $in: courseIds },
        status: 'completed',
      })
        .sort({ endTime: -1 })
        .select('summary endTime durationSeconds')
        .lean();

      students.push({ student, latestSession });
    }

    return res.json({ success: true, students });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/students/:studentId/sessions', async (req, res) => {
  try {
    const allowed = await isStudentInTeacherCourses(req.user.id, req.params.studentId);
    if (!allowed && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const courseIds = await getTeacherCourseIds(req.user.id);
    const sessions = await Session.find({
      userId: req.params.studentId,
      ...(req.user.role === 'admin' ? {} : { courseId: { $in: courseIds } }),
      status: 'completed',
    })
      .sort({ endTime: -1 })
      .select('-windows')
      .populate('courseId', 'title')
      .populate('teacherFeedback.teacherId', 'name')
      .lean();

    const student = await User.findById(req.params.studentId).select(
      'name email programme icbtNumber'
    );

    return res.json({ success: true, student, sessions });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put(
  '/students/:studentId/sessions/:sessionId/comment',
  [body('comment').trim().isLength({ min: 1, max: 2000 })],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, message: 'Comment must be between 1 and 2,000 characters' });
      }
      if (!mongoose.Types.ObjectId.isValid(req.params.studentId) || !mongoose.Types.ObjectId.isValid(req.params.sessionId)) {
        return res.status(400).json({ success: false, message: 'Invalid student or session ID' });
      }

      const courseIds = req.user.role === 'admin' ? [] : await getTeacherCourseIds(req.user.id);
      const session = await Session.findOne({
        _id: req.params.sessionId,
        userId: req.params.studentId,
        status: 'completed',
        ...(req.user.role === 'admin' ? {} : { courseId: { $in: courseIds } }),
      });
      if (!session) {
        return res.status(404).json({ success: false, message: 'Completed report not found in your courses' });
      }

      session.teacherFeedback = {
        teacherId: req.user.id,
        comment: req.body.comment,
        updatedAt: new Date(),
      };
      await session.save();
      await session.populate('teacherFeedback.teacherId', 'name');

      await Notification.create({
        recipientId: req.params.studentId,
        senderId: req.user.id,
        title: 'New report card comment',
        type: 'feedback',
        message: req.body.comment,
        sessionId: session._id,
        metadata: { reportUrl: `/student/reports/${session._id}` },
      });

      return res.json({ success: true, teacherFeedback: session.teacherFeedback });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post(
  '/feedback',
  [
    body('studentId').notEmpty(),
    body('message').trim().notEmpty(),
    body('type').isIn(['feedback', 'encouragement', 'warning']),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      const allowed = await isStudentInTeacherCourses(req.user.id, req.body.studentId);
      if (!allowed && req.user.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'Student not in your courses' });
      }

      const notification = new Notification({
        recipientId: req.body.studentId,
        senderId: req.user.id,
        type: req.body.type,
        message: req.body.message,
      });
      await notification.save();

      return res.json({ success: true, notification });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.get('/earlywarnings', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    const warnings = [];

    for (const sid of studentIds) {
      const sessions = await Session.find({
        userId: sid,
        courseId: { $in: courseIds },
        status: 'completed',
      })
        .sort({ endTime: -1 })
        .limit(3)
        .select('summary endTime')
        .lean();

      if (sessions.length === 0) continue;

      const avg =
        sessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / sessions.length;

      if (avg < 45) {
        const student = await User.findById(sid).select('name email programme');
        warnings.push({
          student,
          averageScore: Math.round(avg * 10) / 10,
          recentScores: sessions.map((s) => s.summary?.averageScore || 0),
        });
      }
    }

    return res.json({ success: true, warnings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/course/:courseId/thresholds', async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    if (req.user.role === 'teacher' && course.teacherId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    if (req.body.engagementThreshold !== undefined) {
      const threshold = Number(req.body.engagementThreshold);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) return res.status(400).json({ success: false, message: 'Engagement threshold must be between 0 and 100' });
      course.settings.engagementThreshold = threshold;
    }
    if (req.body.alertFrequency !== undefined) {
      if (!['low', 'medium', 'high'].includes(req.body.alertFrequency)) return res.status(400).json({ success: false, message: 'Invalid alert frequency' });
      course.settings.alertFrequency = req.body.alertFrequency;
    }

    await course.save();
    return res.json({ success: true, settings: course.settings });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Teacher Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courses = await Course.find({ teacherId: req.user.id }).lean();
    const courseIds = courses.map((course) => course._id);
    
    // Get active sessions
    const activeSessions = await Session.find({
      userId: { $in: studentIds },
      courseId: { $in: courseIds },
      status: 'active'
    }).countDocuments();
    
    // Calculate average engagement
    const completedSessions = await Session.find({
      userId: { $in: studentIds },
      courseId: { $in: courseIds },
      status: 'completed'
    }).lean();
    
    const avgEngagement = completedSessions.length > 0 
      ? completedSessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / completedSessions.length
      : 0;
    
    // Emotion distribution
    const emotionDistribution = {};
    completedSessions.forEach(session => {
      const emotion = session.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });
    
    // At-risk students (engagement < 40)
    const atRiskStudentIds = new Set(completedSessions
      .filter((session) => (session.summary?.averageScore || 0) < 40)
      .map((session) => String(session.userId)));
    const atRiskCount = atRiskStudentIds.size;
    
    // AI insights
    const lowEngagementStudents = atRiskCount;
    const aiInsight = lowEngagementStudents > 0 
      ? `${lowEngagementStudents} students show continuously low engagement this week`
      : 'All students showing good engagement levels';

    return res.json({
      success: true,
      metrics: {
        totalStudents: studentIds.length,
        activeSessions,
        avgEngagement: Math.round(avgEngagement),
        emotionDistribution,
        atRiskCount,
        totalCourses: courses.length
      },
      aiInsight
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Class Overview
router.get('/class-overview', async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user.id }).lean();
    
    const classOverview = await Promise.all(courses.map(async (course) => {
      const studentIds = course.enrolledStudents || [];
      
      const completedSessions = await Session.find({
        userId: { $in: studentIds },
        courseId: course._id,
        status: 'completed'
      }).lean();
      
      const avgEngagement = completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / completedSessions.length
        : 0;
      
      const activeSessions = await Session.find({
        userId: { $in: studentIds },
        courseId: course._id,
        status: 'active'
      }).countDocuments();
      
      return {
        courseId: course._id,
        title: course.title,
        studentCount: studentIds.length,
        avgEngagement: Math.round(avgEngagement),
        activeSessions
      };
    }));

    return res.json({ success: true, classes: classOverview });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Student Analytics (MOST IMPORTANT)
router.get('/students/:studentId/analytics', async (req, res) => {
  try {
    const allowed = await isStudentInTeacherCourses(req.user.id, req.params.studentId);
    if (!allowed && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const courseIds = await getTeacherCourseIds(req.user.id);
    const sessions = await Session.find({
      userId: req.params.studentId,
      ...(req.user.role === 'admin' ? {} : { courseId: { $in: courseIds } }),
      status: 'completed'
    })
      .sort({ endTime: -1 })
      .limit(30)
      .select('summary endTime durationSeconds')
      .lean();

    const student = await User.findById(req.params.studentId).select(
      'name email programme icbtNumber'
    );

    // Engagement trend
    const engagementTrend = sessions.map(s => ({
      date: new Date(s.endTime).toISOString().split('T')[0],
      score: s.summary?.averageScore || 0
    }));

    // Emotion trend
    const emotionTrend = sessions.map(s => ({
      date: new Date(s.endTime).toISOString().split('T')[0],
      emotion: s.summary?.dominantEmotion || 'Neutral'
    }));

    // Attention trend
    const attentionTrend = sessions.map(s => ({
      date: new Date(s.endTime).toISOString().split('T')[0],
      attention: s.summary?.focusPercentage || 0
    }));

    // AI suggestions history
    const aiSuggestions = sessions
      .filter(s => s.summary?.averageScore < 50)
      .map(s => ({
        date: new Date(s.endTime).toISOString().split('T')[0],
        suggestion: `Low engagement detected (${Math.round(s.summary?.averageScore)}%). Recommend additional support.`
      }));

    return res.json({
      success: true,
      student,
      analytics: {
        engagementTrend,
        emotionTrend,
        attentionTrend,
        aiSuggestions
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Live Sessions Monitor
router.get('/live-sessions', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    
    const activeSessions = await Session.find({
      userId: { $in: studentIds },
      courseId: { $in: courseIds },
      status: 'active'
    })
      .populate('userId', 'name email')
      .populate('courseId', 'title')
      .lean();

    const liveStudents = await Promise.all(activeSessions.map(async (session) => {
      // Get latest window data for engagement/emotion status
      const latestWindow = session.windows && session.windows.length > 0 
        ? session.windows[session.windows.length - 1]
        : null;

      return {
        sessionId: session._id,
        student: session.userId,
        course: session.courseId,
        engagement: latestWindow?.score || 0,
        emotion: latestWindow?.dominantEmotion || 'Neutral',
        attention: latestWindow ? (latestWindow.attentionScore > 0.5 ? 'Focused' : 'Distracted') : 'Waiting for data',
        progress: session.overallProgress || 0,
        startTime: session.startTime,
        lastUpdated: latestWindow?.timestamp || session.startTime,
      };
    }));

    return res.json({ success: true, liveStudents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// At-Risk Students (VERY IMPORTANT FOR VIVA)
router.get('/at-risk', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    const atRiskStudents = [];

    for (const sid of studentIds) {
      const sessions = await Session.find({
        userId: sid,
        courseId: { $in: courseIds },
        status: 'completed'
      })
        .sort({ endTime: -1 })
        .limit(7)
        .select('summary endTime')
        .lean();

      if (sessions.length === 0) continue;

      const avgEngagement = sessions.reduce((sum, s) => sum + (s.summary?.averageScore || 0), 0) / sessions.length;
      
      // Count negative emotions
      const negativeEmotions = sessions.filter(s => 
        ['Sad', 'Angry', 'Fearful', 'Disgusted'].includes(s.summary?.dominantEmotion)
      ).length;

      // Check attention pattern
      const avgAttention = sessions.reduce((sum, s) => sum + (s.summary?.focusPercentage || 0), 0) / sessions.length;

      if (avgEngagement < 40 || negativeEmotions > 3 || avgAttention < 50) {
        const student = await User.findById(sid).select('name email programme');
        atRiskStudents.push({
          student,
          engagement: Math.round(avgEngagement),
          emotion: sessions[0]?.summary?.dominantEmotion || 'Neutral',
          attention: Math.round(avgAttention),
          riskFactors: {
            lowEngagement: avgEngagement < 40,
            frequentNegativeEmotions: negativeEmotions > 3,
            poorAttention: avgAttention < 50
          }
        });
      }
    }

    return res.json({ success: true, atRiskStudents });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Emotion Analytics
router.get('/emotions', async (req, res) => {
  try {
    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    
    const sessions = await Session.find({
      userId: { $in: studentIds },
      courseId: { $in: courseIds },
      status: 'completed'
    }).lean();

    const emotionDistribution = {};
    sessions.forEach(session => {
      const emotion = session.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[emotion] = (emotionDistribution[emotion] || 0) + 1;
    });

    // Time-based emotion trend
    const emotionTrend = {};
    sessions.forEach(session => {
      const date = new Date(session.endTime).toISOString().split('T')[0];
      const emotion = session.summary?.dominantEmotion || 'Neutral';
      if (!emotionTrend[date]) {
        emotionTrend[date] = {};
      }
      emotionTrend[date][emotion] = (emotionTrend[date][emotion] || 0) + 1;
    });

    return res.json({
      success: true,
      emotionDistribution,
      emotionTrend: Object.entries(emotionTrend).map(([date, emotions]) => ({
        date,
        ...emotions
      }))
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Engagement Reports
router.get('/engagement-reports', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '7d';
    const days = parseInt(timeRange) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const studentIds = await getTeacherStudentIds(req.user.id);
    const courseIds = await getTeacherCourseIds(req.user.id);
    
    const sessions = await Session.find({
      userId: { $in: studentIds },
      courseId: { $in: courseIds },
      status: 'completed',
      endTime: { $gte: startDate }
    }).lean();

    // Calculate per-student engagement
    const studentEngagement = {};
    sessions.forEach(session => {
      const sid = session.userId.toString();
      if (!studentEngagement[sid]) {
        studentEngagement[sid] = { totalScore: 0, sessionCount: 0 };
      }
      studentEngagement[sid].totalScore += session.summary?.averageScore || 0;
      studentEngagement[sid].sessionCount += 1;
    });

    const engagementReport = await Promise.all(Object.entries(studentEngagement).map(async ([sid, data]) => {
      const student = await User.findById(sid).select('name email');
      return {
        student,
        avgEngagement: Math.round(data.totalScore / data.sessionCount),
        sessionCount: data.sessionCount
      };
    }));

    // Sort by engagement
    engagementReport.sort((a, b) => b.avgEngagement - a.avgEngagement);

    return res.json({
      success: true,
      timeRange,
      topPerformers: engagementReport.slice(0, 5),
      lowEngagement: engagementReport.slice(-5).reverse(),
      totalSessions: sessions.length
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Teacher Notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifications = await Notification.find({
      recipientId: req.user.id,
      type: { $in: ['warning', 'system', 'feedback'] }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return res.json({ success: true, notifications });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
