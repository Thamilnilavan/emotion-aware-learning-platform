const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Course = require('../models/Course');
const User = require('../models/User');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { calculateCourseProgress } = require('../utils/progress');
const { normalizeContent } = require('../utils/courseContent');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'videos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set(['.mp4', '.mov', '.avi', '.mkv', '.webm']);
    const extensionAllowed = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    const mimeAllowed = String(file.mimetype || '').startsWith('video/') || file.mimetype === 'application/octet-stream';
    if (extensionAllowed && mimeAllowed) {
      return cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'video'));
    }
  }
});

const materialStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'materials');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname)).replace(/[^a-z0-9_-]/gi, '-').slice(0, 60);
    cb(null, `${Date.now()}-${safeBase}${path.extname(file.originalname).toLowerCase()}`);
  },
});
const materialUpload = multer({
  storage: materialStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = new Set(['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.txt']);
    if (allowedExtensions.has(path.extname(file.originalname).toLowerCase())) return cb(null, true);
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'material'));
  },
});

const transcriptStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'transcripts');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const safeBase = path.basename(file.originalname, path.extname(file.originalname))
      .replace(/[^a-z0-9_-]/gi, '-')
      .slice(0, 60);
    cb(null, `${Date.now()}-${safeBase}.vtt`);
  },
});
const transcriptUpload = multer({
  storage: transcriptStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (path.extname(file.originalname).toLowerCase() === '.vtt') return cb(null, true);
    return cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'transcript'));
  },
});

router.get('/', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [courses, totalCount] = await Promise.all([
      Course.find({ isActive: true })
        .populate('teacherId', 'name')
        .skip(skip)
        .limit(limit)
        .lean(),
      Course.countDocuments({ isActive: true }),
    ]);
    
    return res.json({ 
      success: true, 
      courses,
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

const handleUpload = (uploader) => (req, res, next) => {
  uploader(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError) {
      const message = error.code === 'LIMIT_FILE_SIZE'
        ? 'The selected file exceeds the upload size limit'
        : 'Unsupported file type or upload field';
      return res.status(400).json({ success: false, message });
    }
    return res.status(400).json({ success: false, message: error.message || 'Upload failed' });
  });
};

// Video upload endpoint
router.post('/upload-video', verifyToken, requireRole('teacher', 'admin'), handleUpload(upload.single('video')), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No video file uploaded' });
    }

    const videoUrl = `/uploads/videos/${req.file.filename}`;
    return res.json({ 
      success: true, 
      videoUrl,
      filename: req.file.filename,
      size: req.file.size
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/upload-material', verifyToken, requireRole('teacher', 'admin'), handleUpload(materialUpload.single('material')), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'A supported document file is required' });
  return res.json({ success: true, materialUrl: `/uploads/materials/${req.file.filename}`, filename: req.file.filename, size: req.file.size });
});

router.post('/upload-transcript', verifyToken, requireRole('teacher', 'admin'), handleUpload(transcriptUpload.single('transcript')), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'A WebVTT (.vtt) transcript is required' });

  try {
    const contents = fs.readFileSync(req.file.path, 'utf8').replace(/^\uFEFF/, '').trimStart();
    if (!contents.startsWith('WEBVTT')) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ success: false, message: 'Invalid transcript. The file must begin with WEBVTT' });
    }
    return res.json({
      success: true,
      transcriptUrl: `/uploads/transcripts/${req.file.filename}`,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(400).json({ success: false, message: 'The transcript file could not be read' });
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

      const course = new Course({
        title: req.body.title,
        description: req.body.description,
        content: normalizeContent(req.body.content),
        integrations: req.body.integrations,
        settings: req.body.settings,
        teacherId: req.user.id,
      });

      await course.save();
      return res.status(201).json({ success: true, course });
    } catch (err) {
      logger.error('Error creating course:', err);
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
        if (req.body[key] !== undefined) course[key] = key === 'content' ? normalizeContent(req.body[key]) : req.body[key];
      });

      await course.save();
      return res.json({ success: true, course });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  }
);

router.post('/:id/students', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'teacher' && String(course.teacherId) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Access denied' });
    const student = req.body.studentId
      ? await User.findOne({ _id: req.body.studentId, role: 'student', isActive: true })
      : await User.findOne({ email: String(req.body.email || '').trim().toLowerCase(), role: 'student', isActive: true });
    if (!student) return res.status(404).json({ success: false, message: 'Active student not found' });
    if (!course.enrolledStudents.some((id) => String(id) === String(student._id))) course.enrolledStudents.push(student._id);
    if (!student.enrolledCourses.some((id) => String(id) === String(course._id))) student.enrolledCourses.push(course._id);
    await Promise.all([course.save(), student.save()]);
    return res.json({ success: true, student: student.toSafeObject() });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

router.delete('/:id/students/:studentId', verifyToken, requireRole('teacher', 'admin'), async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    if (req.user.role === 'teacher' && String(course.teacherId) !== String(req.user.id)) return res.status(403).json({ success: false, message: 'Access denied' });
    course.enrolledStudents = course.enrolledStudents.filter((id) => String(id) !== String(req.params.studentId));
    await Promise.all([
      course.save(),
      User.findByIdAndUpdate(req.params.studentId, { $pull: { enrolledCourses: course._id } }),
    ]);
    return res.json({ success: true, message: 'Student removed from course' });
  } catch (err) { return res.status(500).json({ success: false, message: err.message }); }
});

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
      const Session = require('../models/Session');
      const [studentCourses, SessionData] = await Promise.all([
        Course.find({ enrolledStudents: req.user.id, isActive: true })
          .populate('teacherId', 'name email')
          .lean(),
        Session.find({
          userId: req.user.id,
          status: { $in: ['active', 'completed'] },
        })
          .select('courseId status contentProgress summary.averageScore')
          .lean(),
      ]);
      courses = studentCourses;
      
      courses = courses.map(course => {
        const courseSessions = SessionData.filter(s => s.courseId && s.courseId.toString() === course._id.toString());
        
        const progress = calculateCourseProgress(course, courseSessions);
        let averageEngagement = 0;
        let completedSessions = courseSessions.filter((session) => session.status === 'completed').length;
        let totalSessions = courseSessions.length;
        
        const completedCourseSessions = courseSessions.filter((session) => session.status === 'completed');
        if (completedCourseSessions.length > 0) {
          const scores = completedCourseSessions.map(s => s.summary?.averageScore || 0);
          averageEngagement = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
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
      status: { $in: ['active', 'completed'] }
    }).lean();

    let averageEngagement = 0;
    let focusPercentage = 0;
    let learningHours = 0;
    const progress = calculateCourseProgress(course, sessions);

    const completedSessions = sessions.filter((session) => session.status === 'completed');
    if (completedSessions.length > 0) {
      const scores = completedSessions.map(s => s.summary?.averageScore || 0);
      averageEngagement = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
      
      const focused = completedSessions.filter(s => s.summary?.focusPercentage || 0);
      focusPercentage = Math.round(focused.reduce((a, b) => a + (b.summary?.focusPercentage || 0), 0) / focused.length);
      
      learningHours = Math.round(completedSessions.reduce((a, b) => a + (b.durationSeconds || 0), 0) / 3600);
      
    }

    // Generate session list from course content
    const sessionList = (course.content || []).map((item, index) => {
      const itemProgress = Math.max(0, ...sessions.flatMap((session) =>
        (session.contentProgress || [])
          .filter((entry) => entry.contentIndex === index)
          .map((entry) => entry.percent || 0)
      ));
      const latestCompletedSession = completedSessions.at(-1);
      const duration = item.durationMinutes ? `${item.durationMinutes} min` : '45 min';
      return {
        _id: item._id || `content-${index}`,
        title: item.title || `Session ${index + 1}`,
        duration: duration,
        status: itemProgress >= 90 ? 'completed' : itemProgress > 0 ? 'in_progress' : 'not_started',
        progress: Math.round(itemProgress),
        previousEngagement: latestCompletedSession?.summary?.averageScore || null,
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
