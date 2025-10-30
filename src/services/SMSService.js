const logger = require('@utils/logger');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * SMS Service
 * 
 * Handles SMS sending for OTP
 * Supports multiple providers (Twilio, AWS SNS, custom gateway)
 * 
 * Configuration via environment variables
 */
class SMSService {
  constructor() {
    this.provider = process.env.SMS_PROVIDER || 'console'; // console, twilio, aws, custom
    this.fromNumber = process.env.SMS_FROM_NUMBER;
    
    // Provider-specific config
    this.twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
    this.twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    this.awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
    this.awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
    this.awsRegion = process.env.AWS_REGION || 'us-east-1';
    
    // Custom SMS Gateway
    this.customSmsUrl = process.env.CUSTOM_SMS_GATEWAY_URL;
    this.customSmsApiKey = process.env.CUSTOM_SMS_API_KEY;
    
    // Initialize provider client
    this.initializeProvider();
  }

  /**
   * Initialize SMS provider client
   */
  initializeProvider() {
    try {
      switch (this.provider) {
        case 'twilio':
          if (!this.twilioAccountSid || !this.twilioAuthToken) {
            throw new Error('Twilio credentials not configured');
          }
          // Lazy load Twilio SDK
          this.twilioClient = null;
          break;

        case 'aws':
          if (!this.awsAccessKey || !this.awsSecretKey) {
            throw new Error('AWS credentials not configured');
          }
          // Lazy load AWS SDK
          this.awsSNS = null;
          break;

        case 'custom':
          if (!this.customSmsUrl) {
            throw new Error('Custom SMS gateway URL not configured');
          }
          break;

        case 'console':
          logger.info('SMS Service initialized in console mode (development only)');
          break;

        default:
          logger.warn(`Unknown SMS provider: ${this.provider}, falling back to console`);
          this.provider = 'console';
      }
    } catch (error) {
      logger.error('SMS Service initialization error:', error);
      this.provider = 'console';
    }
  }

  /**
   * Format phone number to E.164 format
   * @param {string} phone - Phone number
   * @returns {string} Formatted phone number
   */
  formatPhoneNumber(phone) {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 05 (UAE local format), convert to international
    if (cleaned.startsWith('05')) {
      cleaned = '971' + cleaned.substring(1);
    }
    
    // Already in international format (9715XXXXXXXX)
    if (cleaned.startsWith('971') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
      return cleaned;
    }
    
    // Add + prefix if not present
    if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate phone number
   * @param {string} phone - Phone number
   * @returns {boolean} Is valid
   */
  validatePhoneNumber(phone) {
    // Basic validation for UAE numbers
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // UAE number: starts with 05 and 10 digits total
    // Or international: 9715XXXXXXXX (12 digits)
    return /^(05\d{8}|9715\d{8})$/.test(cleanedPhone);
  }

  /**
   * Send SMS via Console (Development only)
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaConsole(to, message) {
    logger.info('📱 SMS (Console Mode):', {
      to,
      message,
      timestamp: new Date().toISOString()
    });

    console.log('\n========================================');
    console.log('📱 SMS SENT (DEVELOPMENT MODE)');
    console.log('========================================');
    console.log(`To: ${to}`);
    console.log(`Message: ${message}`);
    console.log('========================================\n');

    return {
      success: true,
      provider: 'console',
      messageId: `console_${Date.now()}`,
      to
    };
  }

  /**
   * Send SMS via Twilio
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaTwilio(to, message) {
    try {
      // Lazy load Twilio
      if (!this.twilioClient) {
        const twilio = require('twilio');
        this.twilioClient = twilio(this.twilioAccountSid, this.twilioAuthToken);
      }

      const result = await this.twilioClient.messages.create({
        body: message,
        from: this.fromNumber,
        to: to
      });

      logger.info('SMS sent via Twilio:', {
        messageId: result.sid,
        to: result.to,
        status: result.status
      });

      return {
        success: true,
        provider: 'twilio',
        messageId: result.sid,
        to: result.to,
        status: result.status
      };
    } catch (error) {
      logger.error('Twilio SMS error:', error);
      throw ErrorHandlers.internal('errors.smsSendFailed');
    }
  }

  /**
   * Send SMS via AWS SNS
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaAWS(to, message) {
    try {
      // Lazy load AWS SDK
      if (!this.awsSNS) {
        const AWS = require('aws-sdk');
        AWS.config.update({
          accessKeyId: this.awsAccessKey,
          secretAccessKey: this.awsSecretKey,
          region: this.awsRegion
        });
        this.awsSNS = new AWS.SNS();
      }

      const params = {
        Message: message,
        PhoneNumber: to,
        MessageAttributes: {
          'AWS.SNS.SMS.SMSType': {
            DataType: 'String',
            StringValue: 'Transactional' // For OTP
          }
        }
      };

      const result = await this.awsSNS.publish(params).promise();

      logger.info('SMS sent via AWS SNS:', {
        messageId: result.MessageId,
        to
      });

      return {
        success: true,
        provider: 'aws',
        messageId: result.MessageId,
        to
      };
    } catch (error) {
      logger.error('AWS SNS error:', error);
      throw ErrorHandlers.internal('errors.smsSendFailed');
    }
  }

  /**
   * Send SMS via Custom Gateway
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendViaCustomGateway(to, message) {
    try {
      const axios = require('axios');

      const response = await axios.post(
        this.customSmsUrl,
        {
          phone: to,
          message: message,
          // Add any custom fields required by your gateway
        },
        {
          headers: {
            'Authorization': `Bearer ${this.customSmsApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // 10 seconds timeout
        }
      );

      logger.info('SMS sent via Custom Gateway:', {
        to,
        response: response.data
      });

      return {
        success: true,
        provider: 'custom',
        messageId: response.data.messageId || response.data.id,
        to,
        response: response.data
      };
    } catch (error) {
      logger.error('Custom Gateway SMS error:', error);
      throw ErrorHandlers.internal('errors.smsSendFailed');
    }
  }

  /**
   * Send SMS (main method)
   * @param {string} to - Recipient phone number
   * @param {string} message - SMS message
   * @returns {Promise<Object>} Send result
   */
  async sendSMS(to, message) {
    try {
      // Validate phone number
      if (!this.validatePhoneNumber(to)) {
        throw ErrorHandlers.badRequest('errors.invalidPhoneNumber');
      }

      // Format phone number
      const formattedPhone = this.formatPhoneNumber(to);

      // Send via configured provider
      let result;

      switch (this.provider) {
        case 'twilio':
          result = await this.sendViaTwilio(formattedPhone, message);
          break;

        case 'aws':
          result = await this.sendViaAWS(formattedPhone, message);
          break;

        case 'custom':
          result = await this.sendViaCustomGateway(formattedPhone, message);
          break;

        case 'console':
        default:
          result = await this.sendViaConsole(formattedPhone, message);
          break;
      }

      return result;
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error('SMS send error:', error);
      throw ErrorHandlers.internal('errors.smsSendFailed');
    }
  }

  /**
   * Send OTP SMS
   * @param {string} phone - Recipient phone number
   * @param {string} otp - OTP code
   * @param {string} type - OTP type (email_verification, password_reset)
   * @returns {Promise<Object>} Send result
   */
  async sendOTP(phone, otp, type = 'email_verification') {
    let message;

    switch (type) {
      case 'phone_verification':
      case 'email_verification':
        message = `رمز التحقق الخاص بك هو: ${otp}\nصالح لمدة ${process.env.OTP_EXPIRY_MINUTES || 10} دقائق.\nلا تشارك هذا الرمز مع أحد.`;
        break;

      case 'password_reset':
        message = `رمز استعادة كلمة المرور: ${otp}\nصالح لمدة ${process.env.OTP_EXPIRY_MINUTES || 10} دقائق.\nإذا لم تطلب هذا، يرجى تجاهل هذه الرسالة.`;
        break;

      case 'login_verification':
        message = `رمز تسجيل الدخول: ${otp}\nصالح لمدة ${process.env.OTP_EXPIRY_MINUTES || 10} دقائق.`;
        break;

      default:
        message = `رمز التحقق: ${otp}`;
    }

    return await this.sendSMS(phone, message);
  }

  /**
   * Get SMS provider status
   * @returns {Object} Provider info
   */
  getProviderInfo() {
    return {
      provider: this.provider,
      configured: this.provider !== 'console',
      fromNumber: this.fromNumber || 'Not configured'
    };
  }
}

module.exports = new SMSService();

