const jwt = require('jsonwebtoken');
const logger = require('@utils/logger');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * OTP Token Service
 * 
 * Handles temporary tokens for OTP verification flow
 * - registerToken: Used during registration OTP verification
 * - loginToken: Used during login OTP verification
 */
class OTPTokenService {
  constructor() {
    this.otpTokenSecret = process.env.JWT_SECRET || 'otp-secret-change-in-production';
    this.otpTokenExpiry = '15m'; // 15 minutes - enough for OTP verification
  }

  /**
   * Generate registration token
   * This token is sent with OTP and must be provided during OTP verification
   * 
   * @param {Object} userData - User data from registration
   * @returns {string} JWT token
   */
  generateRegisterToken(userData) {
    try {
      const payload = {
        type: 'register',
        userId: userData.id,
        phone: userData.phone,
        email: userData.email,
        timestamp: Date.now()
      };

      const token = jwt.sign(payload, this.otpTokenSecret, {
        expiresIn: this.otpTokenExpiry,
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-otp'
      });

      logger.info(`Register token generated for user: ${userData.email}`);
      return token;
    } catch (error) {
      logger.error('Error generating register token:', error);
      throw ErrorHandlers.internal('errors.tokenGenerationFailed');
    }
  }

  /**
   * Generate login token for OTP verification
   * Used when login requires OTP (new device)
   * 
   * @param {Object} userData - User data from login attempt
   * @returns {string} JWT token
   */
  generateLoginToken(userData) {
    try {
      const payload = {
        type: 'login',
        userId: userData.id,
        phone: userData.phone,
        email: userData.email,
        timestamp: Date.now()
      };

      const token = jwt.sign(payload, this.otpTokenSecret, {
        expiresIn: this.otpTokenExpiry,
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-otp'
      });

      logger.info(`Login token generated for user: ${userData.email}`);
      return token;
    } catch (error) {
      logger.error('Error generating login token:', error);
      throw ErrorHandlers.internal('errors.tokenGenerationFailed');
    }
  }

  /**
   * Verify and decode OTP token
   * 
   * @param {string} token - JWT token
   * @param {string} expectedType - Expected token type (register or login)
   * @returns {Object} Decoded token payload
   */
  verifyToken(token, expectedType = null) {
    try {
      if (!token) {
        throw ErrorHandlers.badRequest('validation.tokenRequired');
      }

      const decoded = jwt.verify(token, this.otpTokenSecret, {
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-otp'
      });

      // Verify token type if specified
      if (expectedType && decoded.type !== expectedType) {
        throw ErrorHandlers.badRequest('errors.invalidTokenType', {
          expected: expectedType,
          received: decoded.type
        });
      }

      return decoded;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw ErrorHandlers.unauthorized('errors.otpTokenExpired');
      }
      
      if (error.name === 'JsonWebTokenError') {
        throw ErrorHandlers.unauthorized('errors.invalidOtpToken');
      }

      if (error.isOperational) {
        throw error;
      }

      logger.error('Error verifying OTP token:', error);
      throw ErrorHandlers.unauthorized('errors.invalidOtpToken');
    }
  }

  /**
   * Verify register token
   * 
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyRegisterToken(token) {
    return this.verifyToken(token, 'register');
  }

  /**
   * Verify login token
   * 
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload
   */
  verifyLoginToken(token) {
    return this.verifyToken(token, 'login');
  }

  /**
   * Extract phone from token without full verification
   * Used for validation purposes
   * 
   * @param {string} token - JWT token
   * @returns {string|null} Phone number or null
   */
  extractPhone(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.phone || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract user ID from token without full verification
   * 
   * @param {string} token - JWT token
   * @returns {number|null} User ID or null
   */
  extractUserId(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.userId || null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if token is expired without throwing error
   * 
   * @param {string} token - JWT token
   * @returns {boolean} True if expired
   */
  isTokenExpired(token) {
    try {
      jwt.verify(token, this.otpTokenSecret);
      return false;
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return true;
      }
      return false;
    }
  }
}

module.exports = new OTPTokenService();

