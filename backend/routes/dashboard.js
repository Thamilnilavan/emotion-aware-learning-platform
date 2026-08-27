const express = require('express');
const axios = require('axios');
const User = require('../models/User');
const Session = require('../models/Session');
const Course = require('../models/Course');
const Notification = require('../models/Notification');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { calculateCourseProgress } = require('../utils/progress');

const router = express.Router();

const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// Student-specific routes
router.get('/student/progress', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      status: { $in: ['active', 'completed'] },
    }).lean();

    const user = await User.findById(req.user.id);
    const enrolledCourses = await Course.find({ _id: { $in: user.enrolledCourses || [] } }).lean();

    const totalStudyMinutes = Math.round(
      sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60
    );

    const courseProgress = enrolledCourses.map(course => {
      const courseSessions = sessions.filter(s => s.courseId?.toString() === course._id.toString());
      const progress = calculateCourseProgress(course, courseSessions);
      return {
        courseId: course._id,
        title: course.title,
        progress,
        sessionsCompleted: courseSessions.filter((session) => session.status === 'completed').length,
      };
    });

    const weeklyHours = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => {
        const sd = new Date(s.endTime || s.startTime).toISOString().split('T')[0];
        return sd === dateStr;
      });
      const minutes = daySessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60;
      weeklyHours.push({ date: dateStr, hours: Math.round(minutes * 10) / 10 });
    }

    return res.json({
      success: true,
      totalStudyMinutes,
      courseProgress,
      weeklyHours,
      totalSessions: sessions.filter((session) => session.status === 'completed').length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student/achievements', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      status: 'completed',
    }).lean();

    const totalSessions = sessions.length;
    const averageEngagement = mean(sessions.map((s) => s.summary?.averageScore || 0));

    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasSession = sessions.some((s) => {
        const sd = new Date(s.endTime).toISOString().split('T')[0];
        return sd === dateStr;
      });
      if (hasSession) streakDays++;
      else if (i > 0) break;
    }

    const totalStudyMinutes = Math.round(
      sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60
    );

    const badges = [
      { name: 'First Steps', tier: 'bronze', earned: totalSessions >= 1, description: 'Complete your first learning session' },
      { name: 'Dedicated Learner', tier: 'silver', earned: totalSessions >= 10, description: 'Complete 10 learning sessions' },
      { name: 'Focus Master', tier: 'gold', earned: averageEngagement >= 75, description: 'Maintain 75%+ average engagement' },
      { name: 'Week Warrior', tier: 'gold', earned: streakDays >= 7, description: '7-day learning streak' },
      { name: 'Century Club', tier: 'platinum', earned: totalSessions >= 100, description: 'Complete 100 sessions' },
      { name: 'Time Champion', tier: 'gold', earned: totalStudyMinutes >= 600, description: 'Study for 10+ hours' },
      { name: 'Emotion Master', tier: 'silver', earned: totalSessions >= 5, description: 'Track emotions in 5+ sessions' },
    ];

    const xp = totalSessions * 100 + streakDays * 50 + Math.floor(averageEngagement * 10);

    return res.json({
      success: true,
      badges,
      xp,
      streakDays,
      totalSessions,
      averageEngagement: Math.round(averageEngagement * 10) / 10,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student/recommendations', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      status: 'completed',
    })
      .sort({ endTime: -1 })
      .limit(20)
      .lean();

    const averageEngagement = mean(sessions.map((s) => s.summary?.averageScore || 0));
    const negativeEmotions = sessions.filter(s => 
      ['Sad', 'Angry', 'Fearful', 'Disgusted'].includes(s.summary?.dominantEmotion)
    ).length;

    const teacherMessages = await Notification.find({
      recipientId: req.user.id,
      senderId: { $exists: true },
      type: { $in: ['feedback', 'encouragement', 'warning'] },
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('senderId', 'name role')
      .populate({ path: 'sessionId', select: 'courseId', populate: { path: 'courseId', select: 'title' } })
      .lean();

    const recommendations = teacherMessages
      .filter((message) => ['teacher', 'admin'].includes(message.senderId?.role))
      .slice(0, 5)
      .map((message) => ({
        id: message._id,
        type: 'teacher_tip',
        source: 'teacher',
        title: message.title && message.title !== 'Notification' ? message.title : 'Teacher suggestion',
        description: message.message,
        priority: message.type === 'warning' ? 'high' : 'medium',
        teacherName: message.senderId.name,
        courseName: message.sessionId?.courseId?.title || message.metadata?.courseTitle || 'General guidance',
        courseId: message.sessionId?.courseId?._id || message.metadata?.courseId,
        createdAt: message.createdAt,
        sessionId: message.sessionId,
      }));

    const learningRecommendations = [];

    if (averageEngagement < 50) {
      learningRecommendations.push({
        type: 'study_habit',
        source: 'analytics',
        title: 'Shorter Study Sessions',
        description: 'Try 25-minute focused sessions with 5-minute breaks to improve engagement.',
        priority: 'high',
      });
    }

    if (negativeEmotions > sessions.length / 2) {
      learningRecommendations.push({
        type: 'wellbeing',
        source: 'analytics',
        title: 'Take a Break',
        description: 'Consider taking a break from studying to refresh your mental state.',
        priority: 'medium',
      });
    }

    if (sessions.length < 5) {
      learningRecommendations.push({
        type: 'engagement',
        source: 'analytics',
        title: 'Build Your Routine',
        description: 'Complete more sessions to unlock personalized AI recommendations.',
        priority: 'low',
      });
    }

    if (averageEngagement >= 75) {
      learningRecommendations.push({
        type: 'challenge',
        source: 'analytics',
        title: 'Advanced Topics',
        description: 'Your engagement is excellent! Try more challenging material.',
        priority: 'medium',
      });
    }

    const user = await User.findById(req.user.id);
    const enrolledCourses = await Course.find({ _id: { $in: user.enrolledCourses || [] } }).lean();

    enrolledCourses.forEach(course => {
      learningRecommendations.push({
        type: 'course',
        source: 'course',
        title: `Continue: ${course.title}`,
        description: 'Pick up where you left off in this course.',
        priority: 'low',
        courseId: course._id,
      });
    });

    return res.json({
      success: true,
      recommendations: [...recommendations, ...learningRecommendations].slice(0, 10),
      teacherSuggestionCount: recommendations.length,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/student', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const sessions = await Session.find({
      userId: req.user.id,
      status: 'completed',
    })
      .sort({ endTime: -1 })
      .populate('courseId', 'title')
      .lean();

    const totalSessions = sessions.length;
    const averageEngagement = mean(sessions.map((s) => s.summary?.averageScore || 0));
    const bestSession = sessions.reduce(
      (best, s) =>
        !best || (s.summary?.averageScore || 0) > (best.summary?.averageScore || 0) ? s : best,
      null
    );
    const totalStudyMinutes = Math.round(
      sessions.reduce((sum, s) => sum + (s.durationSeconds || 0), 0) / 60
    );
    const recentSessions = sessions.slice(0, 5);

    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => {
        const sd = new Date(s.endTime).toISOString().split('T')[0];
        return sd === dateStr;
      });
      last7Days.push({
        date: dateStr,
        averageScore: mean(daySessions.map((s) => s.summary?.averageScore || 0)),
      });
    }

    const emotionTrend = sessions.slice(0, 10).map((s) => s.summary?.dominantEmotion || 'Neutral');

    const insights = [];
    if (averageEngagement < 50) {
      insights.push('Your average engagement is below 50%. Try shorter, focused sessions.');
    } else if (averageEngagement >= 75) {
      insights.push('Excellent engagement! You are maintaining strong focus consistently.');
    } else {
      insights.push('Your engagement is improving. Keep building your study routine.');
    }
    if (totalSessions >= 5) {
      insights.push(`You've completed ${totalSessions} sessions — great dedication!`);
    } else {
      insights.push('Complete more sessions to unlock personalised AI insights.');
    }
    const distracted = sessions.filter((s) => (s.summary?.totalDistractions || 0) > 3);
    if (distracted.length > sessions.length / 2) {
      insights.push('Consider enabling high-sensitivity interventions to reduce distractions.');
    } else {
      insights.push('Your focus patterns look healthy. Keep up the good work!');
    }

    let streakDays = 0;
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hasSession = sessions.some((s) => {
        const sd = new Date(s.endTime).toISOString().split('T')[0];
        return sd === dateStr;
      });
      if (hasSession) streakDays++;
      else if (i > 0) break;
    }

    const badges = [];
    if (totalSessions >= 1) badges.push({ name: 'First Steps', tier: 'bronze', earned: true });
    else badges.push({ name: 'First Steps', tier: 'bronze', earned: false });
    if (totalSessions >= 10) badges.push({ name: 'Dedicated Learner', tier: 'silver', earned: true });
    else badges.push({ name: 'Dedicated Learner', tier: 'silver', earned: false });
    if (averageEngagement >= 75) badges.push({ name: 'Focus Master', tier: 'gold', earned: true });
    else badges.push({ name: 'Focus Master', tier: 'gold', earned: false });
    if (streakDays >= 7) badges.push({ name: 'Week Warrior', tier: 'gold', earned: true });
    else badges.push({ name: 'Week Warrior', tier: 'gold', earned: false });

    const emotionDistribution = {};
    sessions.forEach((s) => {
      const e = s.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[e] = (emotionDistribution[e] || 0) + 1;
    });

    return res.json({
      success: true,
      totalSessions,
      averageEngagement: Math.round(averageEngagement * 10) / 10,
      bestSession,
      totalStudyMinutes,
      recentSessions,
      weeklyProgress: last7Days,
      emotionTrend,
      emotionDistribution,
      insights,
      streakDays,
      badges,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/teacher', verifyToken, requireRole('teacher'), async (req, res) => {
  try {
    const courses = await Course.find({ teacherId: req.user.id }).lean();
    const studentIds = [...new Set(courses.flatMap((c) => c.enrolledStudents.map(String)))];

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const sessions = await Session.find({
      userId: { $in: studentIds },
      status: 'completed',
      endTime: { $gte: weekAgo },
    }).lean();

    const classAverageScore = mean(sessions.map((s) => s.summary?.averageScore || 0));

    const atRiskStudents = [];
    const topPerformers = [];
    for (const sid of studentIds) {
      const studentSessions = await Session.find({
        userId: sid,
        status: 'completed',
      })
        .sort({ endTime: -1 })
        .limit(3)
        .lean();
      const avg = mean(studentSessions.map((s) => s.summary?.averageScore || 0));
      const student = await User.findById(sid).select('name email programme');
      if (!student) continue;
      if (avg < 45 && studentSessions.length > 0) {
        atRiskStudents.push({ student, averageScore: avg, sessionCount: studentSessions.length });
      }
      if (avg > 75 && studentSessions.length > 0) {
        topPerformers.push({ student, averageScore: avg, sessionCount: studentSessions.length });
      }
    }

    const weeklyClassEngagement = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const daySessions = sessions.filter((s) => {
        const sd = new Date(s.endTime).toISOString().split('T')[0];
        return sd === dateStr;
      });
      weeklyClassEngagement.push({
        date: dateStr,
        averageScore: mean(daySessions.map((s) => s.summary?.averageScore || 0)),
      });
    }

    const recentAlerts = await Notification.find({
      senderId: req.user.id,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('recipientId', 'name')
      .lean();

    const emotionDistribution = {};
    sessions.forEach((s) => {
      const e = s.summary?.dominantEmotion || 'Neutral';
      emotionDistribution[e] = (emotionDistribution[e] || 0) + 1;
    });

    return res.json({
      success: true,
      totalStudents: studentIds.length,
      classAverageScore: Math.round(classAverageScore * 10) / 10,
      atRiskStudents,
      topPerformers,
      weeklyClassEngagement,
      recentAlerts,
      emotionDistribution,
      courses,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/admin', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [studentCount, teacherCount, adminCount, totalSessions] = await Promise.all([
      User.countDocuments({ role: 'student', isActive: true }),
      User.countDocuments({ role: 'teacher', isActive: true }),
      User.countDocuments({ role: 'admin', isActive: true }),
      Session.countDocuments({ status: 'completed' }),
    ]);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weekSessions = await Session.find({
      status: 'completed',
      endTime: { $gte: weekAgo },
    }).lean();
    const platformAverageEngagement = mean(
      weekSessions.map((s) => s.summary?.averageScore || 0)
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const activeToday = await Session.distinct('userId', {
      startTime: { $gte: today },
    });

    let aiServiceStatus = { status: 'offline' };
    try {
      const aiRes = await axios.get(`${process.env.AI_SERVICE_URL}/health`, { timeout: 3000 });
      aiServiceStatus = aiRes.data;
    } catch {
      aiServiceStatus = { status: 'offline' };
    }

    const recentRegistrations = await User.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .select('name email role createdAt')
      .lean();

    return res.json({
      success: true,
      userCounts: { students: studentCount, teachers: teacherCount, admins: adminCount },
      totalSessions,
      platformAverageEngagement: Math.round(platformAverageEngagement * 10) / 10,
      activeToday: activeToday.length,
      aiServiceStatus,
      recentRegistrations,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
