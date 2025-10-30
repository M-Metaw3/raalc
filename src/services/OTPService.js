const crypto = require('crypto');
const { promisify } = require('util');
const logger = require('@utils/logger');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * OTP Service
 * 
 * Manages OTP generation, storage, and verification using Redis
 * Supports multiple OTP types: email_verification, password_reset
 */
class OTPService {
  constructor() {
    // OTP Configuration from environment
    this.otpLength = parseInt(process.env.OTP_LENGTH) || 6;
    this.otpExpiry = parseInt(process.env.OTP_EXPIRY_MINUTES) || 10; // minutes
    this.maxResendAttempts = parseInt(process.env.OTP_MAX_RESEND_ATTEMPTS) || 3;
    this.resendCooldown = parseInt(process.env.OTP_RESEND_COOLDOWN_MINUTES) || 15; // minutes
  }

  /**
   * Get Redis client with promisified methods
   * @returns {Object} Redis client with async methods
   */
  getRedisClient() {
    if (!global.redis) {
      throw new Error('Redis client not initialized');
    }
    
    const redis = global.redis;
    
    // Promisify Redis methods if not already done
    if (!redis.getAsync) {
      redis.getAsync = promisify(redis.get).bind(redis);
      redis.setexAsync = promisify(redis.setex).bind(redis);
      redis.delAsync = promisify(redis.del).bind(redis);
      redis.ttlAsync = promisify(redis.ttl).bind(redis);
      redis.incrAsync = promisify(redis.incr).bind(redis);
    }
    
    return redis;
  }

  /**
   * Generate random OTP
   * @returns {string} OTP code
   */
  generateOTP() {
    // Generate cryptographically secure random OTP
    const min = Math.pow(10, this.otpLength - 1);
    const max = Math.pow(10, this.otpLength) - 1;
    
    const randomBuffer = crypto.randomBytes(4);
    const randomNumber = randomBuffer.readUInt32BE(0);
    const otp = (randomNumber % (max - min + 1)) + min;
    
    return otp.toString();
  }

  /**
   * Generate Redis key for OTP
   * @param {string} type - OTP type (email_verification, password_reset)
   * @param {string} identifier - User email or phone
   * @returns {string} Redis key
   */
  getOTPKey(type, identifier) {
    return `otp:${type}:${identifier}`;
  }

  /**
   * Generate Redis key for resend attempts tracking
   * @param {string} identifier - User email or phone
   * @returns {string} Redis key
   */
  getResendAttemptsKey(identifier) {
    return `otp:resend:${identifier}`;
  }

  /**
   * Store OTP in Redis
   * @param {string} type - OTP type
   * @param {string} identifier - User email or phone
   * @param {string} otp - OTP code
   * @returns {Promise<boolean>} Success status
   */
  async storeOTP(type, identifier, otp) {
    try {
      const redis = this.getRedisClient();
      const key = this.getOTPKey(type, identifier);
      const expirySeconds = this.otpExpiry * 60;

      // Store OTP with expiry
      await redis.setexAsync(key, expirySeconds, otp);

      // Store metadata (creation time, attempts)
      const metaKey = `${key}:meta`;
      await redis.setexAsync(
        metaKey,
        expirySeconds,
        JSON.stringify({
          createdAt: new Date().toISOString(),
          attempts: 0,
          maxAttempts: 5 // Max verification attempts
        })
      );

      logger.info(`OTP stored for ${type}:${identifier}`);
      return true;
    } catch (error) {
      logger.error('Error storing OTP:', error);
      throw ErrorHandlers.internal('errors.otpGenerationFailed');
    }
  }

  /**
   * Verify OTP
   * @param {string} type - OTP type
   * @param {string} identifier - User email or phone
   * @param {string} otp - OTP code to verify
   * @returns {Promise<boolean>} Verification result
   */
  async verifyOTP(type, identifier, otp) {
    try {
      const redis = this.getRedisClient();
      const key = this.getOTPKey(type, identifier);
      const metaKey = `${key}:meta`;

      // Get stored OTP
      const storedOTP = await redis.getAsync(key);
      
      if (!storedOTP) {
        throw ErrorHandlers.badRequest('errors.otpExpired');
      }

      // Get metadata
      const metaData = await redis.getAsync(metaKey);
      const meta = metaData ? JSON.parse(metaData) : { attempts: 0, maxAttempts: 5 };

      // Check attempts limit
      if (meta.attempts >= meta.maxAttempts) {
        await this.deleteOTP(type, identifier);
        throw ErrorHandlers.badRequest('errors.otpMaxAttemptsExceeded');
      }

      // Increment attempts
      meta.attempts++;
      await redis.setexAsync(metaKey, this.otpExpiry * 60, JSON.stringify(meta));

      // Verify OTP using constant-time comparison to prevent timing attacks
      const isValid = this.constantTimeCompare(otp, storedOTP);

      if (isValid) {
        // Delete OTP after successful verification
        await this.deleteOTP(type, identifier);
        logger.info(`OTP verified successfully for ${type}:${identifier}`);
        return true;
      } else {
        logger.warn(`Invalid OTP attempt for ${type}:${identifier} (${meta.attempts}/${meta.maxAttempts})`);
        throw ErrorHandlers.badRequest('errors.otpInvalid');
      }
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error('Error verifying OTP:', error);
      throw ErrorHandlers.internal('errors.otpVerificationFailed');
    }
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} Are strings equal
   */
  constantTimeCompare(a, b) {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Delete OTP from Redis
   * @param {string} type - OTP type
   * @param {string} identifier - User email or phone
   * @returns {Promise<boolean>} Success status
   */
  async deleteOTP(type, identifier) {
    try {
      const redis = this.getRedisClient();
      const key = this.getOTPKey(type, identifier);
      const metaKey = `${key}:meta`;

      await redis.delAsync(key);
      await redis.delAsync(metaKey);

      return true;
    } catch (error) {
      logger.error('Error deleting OTP:', error);
      return false;
    }
  }

  /**
   * Check if user can request OTP (rate limiting)
   * @param {string} identifier - User email or phone
   * @returns {Promise<Object>} Can resend and remaining attempts
   */
  async canResendOTP(identifier) {
    try {
      const redis = this.getRedisClient();
      const key = this.getResendAttemptsKey(identifier);

      const attempts = await redis.getAsync(key);
      const currentAttempts = attempts ? parseInt(attempts) : 0;

      if (currentAttempts >= this.maxResendAttempts) {
        const ttl = await redis.ttlAsync(key);
        const remainingMinutes = Math.ceil(ttl / 60);

        return {
          canResend: false,
          remainingAttempts: 0,
          retryAfterMinutes: remainingMinutes
        };
      }

      return {
        canResend: true,
        remainingAttempts: this.maxResendAttempts - currentAttempts,
        retryAfterMinutes: 0
      };
    } catch (error) {
      logger.error('Error checking resend limit:', error);
      // Allow resend on error to not block users
      return { canResend: true, remainingAttempts: this.maxResendAttempts, retryAfterMinutes: 0 };
    }
  }

  /**
   * Increment resend attempts counter
   * @param {string} identifier - User email or phone
   * @returns {Promise<boolean>} Success status
   */
  async incrementResendAttempts(identifier) {
    try {
      const redis = this.getRedisClient();
      const key = this.getResendAttemptsKey(identifier);
      const cooldownSeconds = this.resendCooldown * 60;

      const attempts = await redis.getAsync(key);
      
      if (attempts) {
        await redis.incrAsync(key);
      } else {
        await redis.setexAsync(key, cooldownSeconds, '1');
      }

      return true;
    } catch (error) {
      logger.error('Error incrementing resend attempts:', error);
      return false;
    }
  }

  /**
   * Generate and store OTP
   * @param {string} type - OTP type
   * @param {string} identifier - User email or phone
   * @param {boolean} returnOTP - Return OTP in response (dev mode)
   * @returns {Promise<Object>} Generated OTP info
   */
  async generateAndStore(type, identifier, returnOTP = false) {
    // Check rate limiting
    const resendCheck = await this.canResendOTP(identifier);
    
    if (!resendCheck.canResend) {
      throw ErrorHandlers.tooManyRequests('errors.otpResendLimitExceeded', {
        retryAfterMinutes: resendCheck.retryAfterMinutes
      });
    }

    // Generate OTP
    const otp = this.generateOTP();

    // Store in Redis
    await this.storeOTP(type, identifier, otp);

    // Increment resend counter
    await this.incrementResendAttempts(identifier);

    // Return OTP in dev mode only
    const result = {
      otpSent: true
    };

    if (returnOTP && process.env.NODE_ENV !== 'production') {
      result.otp = otp;
      result.expiresIn = `${this.otpExpiry} minutes`;
      logger.warn(`⚠️  OTP included in response (DEV MODE): ${otp}`);
    }

    return { otp, result };
  }

  /**
   * Get OTP info (for testing/debugging - remove in production)
   * @param {string} type - OTP type
   * @param {string} identifier - User email or phone
   * @returns {Promise<Object>} OTP info
   */
  async getOTPInfo(type, identifier) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('OTP info not available in production');
    }

    try {
      const redis = this.getRedisClient();
      const key = this.getOTPKey(type, identifier);
      const metaKey = `${key}:meta`;

      const otp = await redis.getAsync(key);
      const ttl = await redis.ttlAsync(key);
      const metaData = await redis.getAsync(metaKey);

      return {
        exists: !!otp,
        otp: otp, // Only in dev!
        ttl: ttl,
        metadata: metaData ? JSON.parse(metaData) : null
      };
    } catch (error) {
      logger.error('Error getting OTP info:', error);
      return null;
    }
  }
}

module.exports = new OTPService();

