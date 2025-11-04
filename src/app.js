require('dotenv').config();
require('module-alias/register');
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { createConnection } = require('typeorm');
const { initRedis } = require('@config/redis');
const i18next = require('@config/i18n');
const i18nMiddleware = require('./middleware/i18n');
const { errorMiddleware } = require('./middleware/errorHandler');
const routes = require('./routes');
const logger = require('@utils/logger');
// const { initSchedulers, queues } = require('./services/Queue'); // Disabled - not needed for OTP

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 4000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
// app.use(cors({
//   origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
//   credentials: true
// }));
app.use(cors('*'));
// Body parsing with error handling
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// JSON parsing error handler
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.error('Invalid JSON in request body', {
      path: req.path,
      method: req.method,
      error: err.message
    });
    
    return res.status(400).json({
      ok: false,
      message: req.t ? req.t('errors.invalidJson') : 'Invalid JSON format in request body',
      messageKey: 'errors.invalidJson',
      ...(process.env.NODE_ENV === 'development' && {
        detail: err.message
      })
    });
  }
  next(err);
});

// Compression
app.use(compression());

// Request logging with Winston
morgan.token('body', (req) => {
  try {
    const body = { ...req.body };
    // Mask sensitive fields
    if (body.password) body.password = '***';
    if (body.token) body.token = '***';
    return JSON.stringify(body);
  } catch (_) {
    return '{}';
  }
});

app.use(morgan(':method :url :status :response-time ms - :body', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Static files
app.use('/uploads', express.static('uploads'));

// i18n middleware
app.use(i18nMiddleware);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api', routes);

// Error handling middleware (must be last)
app.use(errorMiddleware);

// Database connection and server startup
createConnection(require('@config/database'))
  .then(async () => {
    logger.info('✅ Database connected');
    
    // Initialize Redis with timeout
    try {
      await Promise.race([
        initRedis(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Redis connection timeout')), 5000)
        )
      ]);
      global.redis = require('@config/redis').getRedisClient();
      logger.info('✅ Redis connected');
    } catch (error) {
      logger.error('❌ Redis connection failed:', error.message);
      logger.warn('⚠️ Application will run without Redis (OTP features may be limited)');
      global.redis = null; // Ensure redis is null
    }
    
    server.listen(PORT, () => {
      logger.info(`🚀 ${process.env.APP_NAME || 'RAALC API'} running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌍 URL: ${process.env.APP_URL || `http://localhost:${PORT}`}`);
    });
    
    // Initialize background job schedulers (disabled - not needed for OTP)
    // try {
    //   initSchedulers();
    //   logger.info('✅ Job schedulers initialized');
    // } catch (error) {
    //   logger.error('❌ Failed to initialize schedulers', { error: error.message });
    // }
    
    // Load background workers (disabled - not needed for OTP)
    // try {
    //   require('./workers/emailWorker');
    //   require('./workers/notificationWorker');
    //   require('./workers/cleanupWorker');
    //   logger.info('✅ Background workers loaded');
    // } catch (error) {
    //   logger.warn('⚠️ Some workers failed to load', { error: error.message });
    // }
  })
  .catch((err) => {
    logger.error('❌ Database connection error:', err);
    console.log(err);
    process.exit(1);
  });

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, closing server gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, closing server gracefully');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

module.exports = app;

