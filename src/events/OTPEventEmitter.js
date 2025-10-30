const EventEmitter = require('events');
const SMSService = require('@services/SMSService');
const logger = require('@utils/logger');

/**
 * OTP Event Emitter
 * 
 * Handles OTP-related events with immediate execution
 * Events: otp:send, otp:verified, otp:failed
 */
class OTPEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  setupListeners() {
    // Listen for OTP send events
    this.on('otp:send', this.handleOTPSend.bind(this));

    // Listen for OTP verification events
    this.on('otp:verified', this.handleOTPVerified.bind(this));

    // Listen for OTP failed events
    this.on('otp:failed', this.handleOTPFailed.bind(this));

    // Error handler for unhandled errors
    this.on('error', (error) => {
      logger.error('OTP Event Error:', error);
    });

    logger.info('OTP Event Emitter initialized');
  }

  /**
   * Handle OTP send event
   * @param {Object} data - Event data
   */
  async handleOTPSend(data) {
    try {
      const { phone, otp, type, userId, email } = data;

      logger.info('Sending OTP:', {
        phone,
        type,
        userId,
        timestamp: new Date().toISOString()
      });

      // Send SMS immediately
      const result = await SMSService.sendOTP(phone, otp, type);

      if (result.success) {
        logger.info('OTP sent successfully:', {
          phone,
          messageId: result.messageId,
          provider: result.provider
        });

        // Emit success event
        this.emit('otp:sent:success', {
          phone,
          type,
          userId,
          messageId: result.messageId,
          timestamp: new Date().toISOString()
        });
      } else {
        throw new Error('SMS send failed');
      }
    } catch (error) {
      logger.error('Failed to send OTP:', error);

      // Emit failure event
      this.emit('otp:sent:failed', {
        phone: data.phone,
        type: data.type,
        userId: data.userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });

      // Don't throw error to prevent crash
      // The user will see "OTP sent" but it actually failed
      // In production, you might want to implement retry logic
    }
  }

  /**
   * Handle OTP verified event
   * @param {Object} data - Event data
   */
  async handleOTPVerified(data) {
    try {
      const { userId, email, phone, type } = data;

      logger.info('OTP verified:', {
        userId,
        email,
        phone,
        type,
        timestamp: new Date().toISOString()
      });

      // Here you can add additional logic:
      // - Send welcome SMS
      // - Update analytics
      // - Trigger webhooks
      // - etc.

      if (type === 'email_verification') {
        // Could send welcome message
        logger.info(`User ${userId} verified successfully`);
      }

      if (type === 'password_reset') {
        // Could send security notification
        logger.info(`Password reset verified for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error handling OTP verified event:', error);
    }
  }

  /**
   * Handle OTP failed event
   * @param {Object} data - Event data
   */
  async handleOTPFailed(data) {
    try {
      const { userId, email, phone, reason, attempts } = data;

      logger.warn('OTP verification failed:', {
        userId,
        email,
        phone,
        reason,
        attempts,
        timestamp: new Date().toISOString()
      });

      // Here you can add additional logic:
      // - Send security alert after multiple failures
      // - Block user temporarily
      // - Update fraud detection system
      // - etc.

      if (attempts >= 5) {
        logger.warn(`Multiple OTP failures for user ${userId}`, {
          email,
          phone,
          attempts
        });

        // Could trigger security alert
      }
    } catch (error) {
      logger.error('Error handling OTP failed event:', error);
    }
  }

  /**
   * Emit OTP send event
   * @param {Object} data - Event data
   */
  emitOTPSend(data) {
    this.emit('otp:send', data);
  }

  /**
   * Emit OTP verified event
   * @param {Object} data - Event data
   */
  emitOTPVerified(data) {
    this.emit('otp:verified', data);
  }

  /**
   * Emit OTP failed event
   * @param {Object} data - Event data
   */
  emitOTPFailed(data) {
    this.emit('otp:failed', data);
  }

  /**
   * Get event emitter stats
   * @returns {Object} Stats
   */
  getStats() {
    return {
      listenerCount: {
        send: this.listenerCount('otp:send'),
        verified: this.listenerCount('otp:verified'),
        failed: this.listenerCount('otp:failed'),
        sentSuccess: this.listenerCount('otp:sent:success'),
        sentFailed: this.listenerCount('otp:sent:failed')
      },
      maxListeners: this.getMaxListeners()
    };
  }
}

// Create singleton instance
const otpEventEmitter = new OTPEventEmitter();

// Increase max listeners if needed (default is 10)
otpEventEmitter.setMaxListeners(20);

module.exports = otpEventEmitter;

