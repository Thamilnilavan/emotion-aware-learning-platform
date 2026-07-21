const express = require('express');
const { body, validationResult } = require('express-validator');
const Course = require('../models/Course');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const courses = await Course.find({ isActive: true })
      .populate('teacherId', 'name')
      .lean();
    return res.json({ success: true, courses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post(
  '/',
  verifyToken,
  requireRole('teacher', 'admin'),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }

      console.log('Creating course with body:', req.body);

      const course = new Course({
        ...req.body,
        teacherId: req.user.id,
      });

      console.log('Course object before save:', course);

      await course.save();
      return res.status(201).json({ success: true, course });
    } catch (err) {
      console.error('Error creating course:', err);
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.put(
  '/:id',
  verifyToken,
  requireRole('teacher', 'admin'),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);
      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      if (req.user.role === 'teacher' && course.teacherId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Access denied' });
      }

      const allowed = ['title', 'description', 'content', 'integrations', 'settings', 'isActive'];
      allowed.forEach((key) => {
        if (req.body[key] !== undefined) course[key] = req.body[key];
      });

      await course.save();
      return res.json({ success: true, course });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post('/:id/enroll', verifyToken, requireRole('student'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const studentId = req.user.id;
    const alreadyEnrolled = course.enrolledStudents.some(
      (id) => id.toString() === studentId
    );
    if (!alreadyEnrolled) {
      course.enrolledStudents.push(studentId);
      await course.save();
    }

    const user = await User.findById(studentId);
    const alreadyOnUser = user.enrolledCourses.some(
      (id) => id.toString() === course._id.toString()
    );
    if (!alreadyOnUser) {
      user.enrolledCourses.push(course._id);
      await user.save();
    }

    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/my', verifyToken, async (req, res) => {
  try {
    let courses;
    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      courses = await Course.find({ teacherId: req.user.id })
        .populate('enrolledStudents', 'name email')
        .lean();
    } else {
      const user = await User.findById(req.user.id).select('enrolledCourses');
      courses = await Course.find({
        $or: [
          { enrolledStudents: req.user.id },
          { _id: { $in: user?.enrolledCourses || [] } },
        ],
        isActive: true,
      })
        .populate('teacherId', 'name email')
        .lean();
      
      // Calculate analytics for student courses
      const Session = require('../models/Session');
      const SessionData = await Session.find({ 
        userId: req.user.id,
        status: 'completed'
      }).lean();
      
      courses = courses.map(course => {
        const courseSessions = SessionData.filter(s => s.courseId && s.courseId.toString() === course._id.toString());
        
        let progress = 0;
        let averageEngagement = 0;
        let completedSessions = courseSessions.length;
        let totalSessions = course.content?.length || 0;
        
        if (courseSessions.length > 0) {
          const scores = courseSessions.map(s => s.summary?.averageScore || 0);
          averageEngagement = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
          if (totalSessions > 0) {
            progress = Math.min(100, Math.round((completedSessions / totalSessions) * 100));
          }
        }
        
        return {
          ...course,
          progress,
          averageEngagement,
          completedSessions,
          totalSessions
        };
      });
    }
    return res.json({ success: true, courses });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('teacherId', 'name email')
      .lean();
    
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Check access
    const user = await User.findById(req.user.id).select('enrolledCourses');
    const isEnrolledOnCourse = course.enrolledStudents.some(
      (id) => id.toString() === req.user.id
    );
    const isEnrolledOnUser = (user?.enrolledCourses || []).some(
      (id) => id.toString() === course._id.toString()
    );
    const isEnrolled = isEnrolledOnCourse || isEnrolledOnUser;
    const isTeacher = course.teacherId._id.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isEnrolled && !isTeacher && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Calculate course analytics
    const Session = require('../models/Session');
    const sessions = await Session.find({ 
      courseId: req.params.id,
      userId: req.user.id,
      status: 'completed'
    }).lean();

    let averageEngagement = 0;
    let focusPercentage = 0;
    let learningHours = 0;
    let progress = 0;

    if (sessions.length > 0) {
      const scores = sessions.map(s => s.summary?.averageScore || 0);
      averageEngagement = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      const focused = sessions.filter(s => s.summary?.focusPercentage || 0);
      focusPercentage = Math.round(focused.reduce((a, b) => a + (b.summary?.focusPercentage || 0), 0) / focused.length);
      
      learningHours = Math.round(sessions.reduce((a, b) => a + (b.durationSeconds || 0), 0) / 3600);
      
      progress = Math.min(100, Math.round((sessions.length / (course.content?.length || 1)) * 100));
    }

    // Generate session list from course content
    const sessionList = (course.content || []).map((item, index) => {
      const sessionData = sessions.find(s => s.sessionNumber === index + 1);
      const duration = item.durationMinutes ? `${item.durationMinutes} min` : '45 min';
      return {
        _id: sessionData?._id || `temp-${index}`,
        title: item.title || `Session ${index + 1}`,
        duration: duration,
        status: sessionData ? 'completed' : 'not_started',
        previousEngagement: sessionData?.summary?.averageScore || null,
        sessionNumber: index + 1,
      };
    });

    return res.json({ 
      success: true, 
      course: {
        ...course,
        averageEngagement,
        focusPercentage,
        learningHours,
        progress,
      },
      sessions: sessionList,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
