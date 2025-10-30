const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * OTP Rate Limiting Middleware
 * 
 * Prevents abuse of OTP endpoints by limiting requests per IP/phone
 * Uses Redis for distributed rate limiting
 */
class OTPRateLimiter {
  constructor() {
    this.windowMs = parseInt(process.env.OTP_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000; // 15 minutes
    this.maxAttempts = parseInt(process.env.OTP_RATE_LIMIT_MAX_ATTEMPTS) || 5;
  }

  /**
   * Get Redis client
   * @returns {Object} Redis client
   */
  getRedisClient() {
    if (!global.redis) {
      throw new Error('Redis client not initialized');
    }
    return global.redis;
  }

  /**
   * Generate rate limit key
   * @param {string} identifier - IP or phone number
   * @param {string} type - Request type (send, verify)
   * @returns {string} Redis key
   */
  getRateLimitKey(identifier, type) {
    return `ratelimit:otp:${type}:${identifier}`;
  }

  /**
   * Rate limiter for OTP send/resend requests
   * Limits based on register token (extracts phone from token)
   */
  limitSendOTP() {
    return async (req, res, next) => {
      try {
        const { registerToken } = req.body;

        if (!registerToken) {
          return next(ErrorHandlers.badRequest('validation.tokenRequired'));
        }

        // Extract phone from token
        const OTPTokenService = require('@services/OTPTokenService');
        const phone = OTPTokenService.extractPhone(registerToken);

        if (!phone) {
          return next(ErrorHandlers.badRequest('errors.invalidOtpToken'));
        }

        const redis = this.getRedisClient();
        const key = this.getRateLimitKey(phone, 'send');

        // Get current attempts
        const attempts = await redis.get(key);
        const currentAttempts = attempts ? parseInt(attempts) : 0;

        if (currentAttempts >= this.maxAttempts) {
          const ttl = await redis.ttl(key);
          const remainingMinutes = Math.ceil(ttl / 60);

          logger.warn(`OTP send rate limit exceeded for phone: ${phone}`);

          return next(
            ErrorHandlers.tooManyRequests('errors.rateLimitExceeded', {
              retryAfterMinutes: remainingMinutes
            })
          );
        }

        // Increment attempts
        if (attempts) {
          await redis.incr(key);
        } else {
          await redis.setex(key, Math.floor(this.windowMs / 1000), '1');
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', this.maxAttempts);
        res.setHeader('X-RateLimit-Remaining', this.maxAttempts - currentAttempts - 1);

        next();
      } catch (error) {
        logger.error('OTP rate limiter error:', error);
        // Allow request on error to not block users
        next();
      }
    };
  }

  /**
   * Rate limiter for OTP verification requests
   * Limits based on token (extracts phone) + IP combination
   */
  limitVerifyOTP() {
    return async (req, res, next) => {
      try {
        const { registerToken, loginToken, resetToken } = req.body;
        const token = registerToken || loginToken || resetToken;
        
        const ip = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress;

        if (!token) {
          return next(ErrorHandlers.badRequest('validation.tokenRequired'));
        }

        // Extract phone from token
        const OTPTokenService = require('@services/OTPTokenService');
        const phone = OTPTokenService.extractPhone(token);

        if (!phone) {
          return next(ErrorHandlers.badRequest('errors.invalidOtpToken'));
        }

        const redis = this.getRedisClient();
        const key = this.getRateLimitKey(`${phone}:${ip}`, 'verify');

        // Higher limit for verification (allows for typos)
        const maxVerifyAttempts = 10;
        
        // Get current attempts
        const attempts = await redis.get(key);
        const currentAttempts = attempts ? parseInt(attempts) : 0;

        if (currentAttempts >= maxVerifyAttempts) {
          const ttl = await redis.ttl(key);
          const remainingMinutes = Math.ceil(ttl / 60);

          logger.warn(`OTP verify rate limit exceeded for phone: ${phone}, IP: ${ip}`);

          return next(
            ErrorHandlers.tooManyRequests('errors.verifyRateLimitExceeded', {
              retryAfterMinutes: remainingMinutes
            })
          );
        }

        // Increment attempts
        if (attempts) {
          await redis.incr(key);
        } else {
          await redis.setex(key, Math.floor(this.windowMs / 1000), '1');
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxVerifyAttempts);
        res.setHeader('X-RateLimit-Remaining', maxVerifyAttempts - currentAttempts - 1);

        next();
      } catch (error) {
        logger.error('OTP verify rate limiter error:', error);
        // Allow request on error to not block users
        next();
      }
    };
  }

  /**
   * Rate limiter for forgot password requests
   * Limits based on email + IP combination
   */
  limitForgotPassword() {
    return async (req, res, next) => {
      try {
        const { email } = req.body;
        const ip = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress;

        if (!email) {
          return next(ErrorHandlers.badRequest('validation.emailRequired'));
        }

        const redis = this.getRedisClient();
        const key = this.getRateLimitKey(`${email}:${ip}`, 'forgot');

        // Strict limit for forgot password
        const maxForgotAttempts = 3;
        
        // Get current attempts
        const attempts = await redis.get(key);
        const currentAttempts = attempts ? parseInt(attempts) : 0;

        if (currentAttempts >= maxForgotAttempts) {
          const ttl = await redis.ttl(key);
          const remainingMinutes = Math.ceil(ttl / 60);

          logger.warn(`Forgot password rate limit exceeded for email: ${email}, IP: ${ip}`);

          return next(
            ErrorHandlers.tooManyRequests('errors.forgotPasswordRateLimit', {
              retryAfterMinutes: remainingMinutes
            })
          );
        }

        // Increment attempts
        if (attempts) {
          await redis.incr(key);
        } else {
          // Longer window for forgot password (1 hour)
          await redis.setex(key, 3600, '1');
        }

        // Add rate limit info to response headers
        res.setHeader('X-RateLimit-Limit', maxForgotAttempts);
        res.setHeader('X-RateLimit-Remaining', maxForgotAttempts - currentAttempts - 1);

        next();
      } catch (error) {
        logger.error('Forgot password rate limiter error:', error);
        // Allow request on error to not block users
        next();
      }
    };
  }

  /**
   * Reset rate limit for a phone number (Admin only)
   * @param {string} phone - Phone number
   * @param {string} type - Type (send, verify)
   * @returns {Promise<boolean>} Success status
   */
  async resetRateLimit(phone, type) {
    try {
      const redis = this.getRedisClient();
      const key = this.getRateLimitKey(phone, type);
      await redis.del(key);
      logger.info(`Rate limit reset for ${phone} (type: ${type})`);
      return true;
    } catch (error) {
      logger.error('Error resetting rate limit:', error);
      return false;
    }
  }

  /**
   * Get rate limit status
   * @param {string} identifier - Phone or email
   * @param {string} type - Type (send, verify, forgot)
   * @returns {Promise<Object>} Rate limit status
   */
  async getRateLimitStatus(identifier, type) {
    try {
      const redis = this.getRedisClient();
      const key = this.getRateLimitKey(identifier, type);

      const attempts = await redis.get(key);
      const ttl = await redis.ttl(key);

      return {
        currentAttempts: attempts ? parseInt(attempts) : 0,
        maxAttempts: this.maxAttempts,
        remainingAttempts: Math.max(0, this.maxAttempts - (attempts ? parseInt(attempts) : 0)),
        resetAfterSeconds: ttl > 0 ? ttl : 0
      };
    } catch (error) {
      logger.error('Error getting rate limit status:', error);
      return null;
    }
  }
}

module.exports = new OTPRateLimiter();

