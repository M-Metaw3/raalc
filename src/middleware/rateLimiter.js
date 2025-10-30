const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');

/**
 * General API rate limiter
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    ok: false,
    message: 'Too many requests from this IP, please try again later.',
    messageKey: 'errors.tooManyRequests'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      ok: false,
      message: req.t('errors.tooManyRequests'),
      messageKey: 'errors.tooManyRequests'
    });
  }
});

/**
 * Strict rate limiter for sensitive endpoints (login, register, etc.)
 */
const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  skipSuccessfulRequests: true, // Don't count successful requests
  message: {
    ok: false,
    message: 'Too many attempts, please try again later.',
    messageKey: 'errors.tooManyAttempts'
  },
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      ok: false,
      message: req.t('errors.tooManyAttempts'),
      messageKey: 'errors.tooManyAttempts'
    });
  }
});

/**
 * File upload rate limiter
 */
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 uploads per hour
  message: {
    ok: false,
    message: 'Too many upload requests, please try again later.',
    messageKey: 'errors.tooManyUploads'
  }
});

module.exports = { apiLimiter, strictLimiter, uploadLimiter };

