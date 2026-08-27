require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const logger = require('./utils/logger');

const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const courseRoutes = require('./routes/courses');
const dashboardRoutes = require('./routes/dashboard');
const teacherRoutes = require('./routes/teacher');
const adminRoutes = require('./routes/admin');
const aiRoutes = require('./routes/ai');
const assistantRoutes = require('./routes/assistant');
const plannerRoutes = require('./routes/planner');
const { sanitizeInput } = require('./middleware/sanitize');

const app = express();

mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    maxIdleTimeMS: 30000,
    socketTimeoutMS: 45000,
  })
  .then(() => logger.info('MongoDB connected'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected; database-backed requests will return 503 until reconnected.');
});

mongoose.connection.on('reconnected', () => {
  logger.info('MongoDB reconnected');
});

// CORS must be before helmet
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: 86400,
  })
);

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true,
}));

app.use(morgan('dev'));
app.use(sanitizeInput);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Serve static files for uploaded videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { success: false, message: 'Too many AI requests, please slow down.' },
});
app.use('/api/ai', aiLimiter, aiRoutes);

// AI traffic has its own limiter and must not consume the general API quota.
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/assistant', assistantRoutes);
app.use('/api/planner', plannerRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      ai: 'unknown'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };

  // Check AI service availability
  try {
    const axios = require('axios');
    const AI_GATEWAY_URL = process.env.AI_GATEWAY_URL || 'http://localhost:5000';
    await axios.get(`${AI_GATEWAY_URL}/health`, { timeout: 3000 });
    health.services.ai = 'connected';
  } catch (error) {
    health.services.ai = 'disconnected';
    health.status = 'degraded';
  }

  if (health.services.database !== 'connected') {
    health.status = 'unhealthy';
    return res.status(503).json(health);
  }

  if (health.status === 'degraded') {
    return res.status(200).json(health);
  }

  return res.json(health);
});

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
