const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const UserRepository = require('@repositories/UserRepository');
const UserDocumentRepository = require('@repositories/UserDocumentRepository');
const OTPService = require('./OTPService');
const OTPTokenService = require('./OTPTokenService');
const otpEventEmitter = require('../events/OTPEventEmitter');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * User Service with OTP Support
 * 
 * Handles all user-related business logic with OTP verification
 * Flow: Register → Send OTP → Verify OTP → Activate Account
 */
class UserService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    this.saltRounds = 12;
  }

  /**
   * Register a new user with OTP verification
   * Creates user as inactive, sends OTP for verification
   * 
   * @param {Object} userData - User data
   * @param {boolean} returnOTP - Return OTP in response (dev mode)
   * @returns {Promise<Object>} Created user (unverified) with registerToken
   */
  async register(userData, returnOTP = false) {
    try {
      const { fullName, email, password, phone } = userData;

      // Validate phone number
      if (!phone) {
        throw ErrorHandlers.badRequest('validation.phoneRequired');
      }

      // Check if email or phone already exists
      const existingUser = await UserRepository.findByEmail(email);
      if (existingUser) {
        throw ErrorHandlers.conflict('auth.emailAlreadyExists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, this.saltRounds);

      // Create user (inactive and unverified)
      const user = await UserRepository.create({
        fullName,
        email: email.toLowerCase(),
        password: hashedPassword,
        phone,
        isActive: false, // Will activate after OTP verification
        isEmailVerified: false,
        isPhoneVerified: false
      });

      // Generate and store OTP
      const { otp, result: otpResult } = await OTPService.generateAndStore(
        'phone_verification', 
        phone, 
        returnOTP
      );

      // Generate register token
      const registerToken = OTPTokenService.generateRegisterToken({
        id: user.id,
        phone: user.phone,
        email: user.email
      });

      // Emit event to send OTP via SMS (immediate)
      otpEventEmitter.emitOTPSend({
        phone,
        otp,
        type: 'phone_verification',
        userId: user.id,
        email: user.email
      });

      // Remove sensitive data
      delete user.password;

      logger.info(`User registered (pending verification): ${user.email}`);

      return {
        user: { ...user, userType: 'USER' },
        message: 'Registration successful. Please verify your phone number with the OTP sent.',
        registerToken,
        ...otpResult
      };
    } catch (error) {
      logger.error('User registration error:', error);
      throw error;
    }
  }

  /**
   * Verify OTP and activate user account
   * 
   * @param {string} registerToken - Register token from registration
   * @param {string} otp - OTP code
   * @returns {Promise<Object>} Activated user and tokens
   */
  async verifyRegistrationOTP(registerToken, otp) {
    try {
      // Verify register token
      const tokenData = OTPTokenService.verifyRegisterToken(registerToken);

      // Verify OTP
      await OTPService.verifyOTP('phone_verification', tokenData.phone, otp);

      // Find user
      const user = await UserRepository.findById(tokenData.userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Activate user
      const updatedUser = await UserRepository.update(user.id, {
        isPhoneVerified: true,
        isEmailVerified: true, // Auto-verify email on phone verification
        isActive: true
      });

      // Emit verified event
      otpEventEmitter.emitOTPVerified({
        userId: updatedUser.id,
        email: updatedUser.email,
        phone: updatedUser.phone,
        type: 'phone_verification'
      });

      delete updatedUser.password;

      logger.info(`User verified and activated: ${updatedUser.email}`);

      // Check if documents uploaded
      if (!updatedUser.documentsUploaded) {
        const minDocuments = parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1;
        const maxDocuments = parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5;
        
        // Generate temporary tokens for document upload
        const tokens = this.generateTokens(updatedUser);
        
        return {
          requiresDocuments: true,
          message: 'Registration successful. Please upload required documents to complete your profile.',
          user: { 
            ...updatedUser, 
            userType: 'USER'
          },
          tokens, // Include tokens for document upload
          minDocuments,
          maxDocuments
        };
      }

      // Generate authentication tokens
      const tokens = this.generateTokens(updatedUser);

      return {
        user: { ...updatedUser, userType: 'USER' },
        tokens
      };
    } catch (error) {
      logger.error('OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Resend OTP
   * 
   * @param {string} registerToken - Register token
   * @param {boolean} returnOTP - Return OTP in response (dev mode)
   * @returns {Promise<Object>} Success message
   */
  async resendRegistrationOTP(registerToken, returnOTP = false) {
    try {
      // Verify register token
      const tokenData = OTPTokenService.verifyRegisterToken(registerToken);

      // Check if user exists
      const user = await UserRepository.findById(tokenData.userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Check if already verified
      if (user.isPhoneVerified && user.isActive) {
        throw ErrorHandlers.badRequest('auth.alreadyVerified');
      }

      // Generate and store new OTP
      const { otp, result: otpResult } = await OTPService.generateAndStore(
        'phone_verification',
        user.phone,
        returnOTP
      );

      // Emit event to send OTP
      otpEventEmitter.emitOTPSend({
        phone: user.phone,
        otp,
        type: 'phone_verification',
        userId: user.id,
        email: user.email
      });

      logger.info(`OTP resent to: ${user.phone}`);

      return {
        message: 'OTP resent successfully',
        ...otpResult
      };
    } catch (error) {
      logger.error('Resend OTP error:', error);
      throw error;
    }
  }

  /**
   * User login with device verification
   * Supports login with email or phone number
   * Sends OTP if logging in from new device
   * 
   * @param {string} identifier - User email or phone number
   * @param {string} password - User password
   * @param {string} ip - IP address
   * @param {string} deviceId - Device identifier (optional)
   * @param {string} fcmToken - Firebase Cloud Messaging token (optional)
   * @param {boolean} returnOTP - Return OTP in response (dev mode)
   * @returns {Promise<Object>} User and tokens or OTP required
   */
  async login(identifier, password, ip = null, deviceId = null, fcmToken = null, returnOTP = false) {
    try {
      // Find user by email or phone
      const user = await UserRepository.findByEmailOrPhone(
        identifier.toLowerCase ? identifier.toLowerCase() : identifier,
        true
      );
      
      if (!user) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      // Check if account is verified (either email or phone must be verified)
      if ((!user.isPhoneVerified && !user.isEmailVerified) || !user.isActive) {
        throw ErrorHandlers.forbidden('auth.accountNotVerified');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        logger.warn(`Failed user login attempt for: ${identifier} from IP: ${ip}`);
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      // Check if new device by comparing deviceId
      const isNewDevice = deviceId && user.lastDeviceId && user.lastDeviceId !== deviceId;

      if (isNewDevice) {
        // Generate and store OTP for device verification
        const { otp, result: otpResult } = await OTPService.generateAndStore(
          'login_verification',
          user.phone,
          returnOTP
        );

        // Generate login token
        const loginToken = OTPTokenService.generateLoginToken({
          id: user.id,
          phone: user.phone,
          email: user.email
        });

        // Emit event to send OTP
        otpEventEmitter.emitOTPSend({
          phone: user.phone,
          otp,
          type: 'login_verification',
          userId: user.id,
          email: user.email
        });

        logger.info(`New device detected for ${user.email}, OTP sent`);

        return {
          requiresOTP: true,
          message: 'New device detected. Please verify with OTP sent to your phone.',
          loginToken,
          phone: user.phone,
          userId: user.id,
          ...otpResult
        };
      }

      // Regular login (same device)
      const updateData = {};
      if (ip) {
        updateData.lastLoginAt = new Date();
        updateData.lastLoginIp = ip;
      }
      if (deviceId) {
        updateData.lastDeviceId = deviceId;
      }
      if (fcmToken) {
        updateData.fcmToken = fcmToken;
      }
      
      if (Object.keys(updateData).length > 0) {
        await UserRepository.update(user.id, updateData);
      }

      // Check if documents uploaded
      if (!user.documentsUploaded) {
        const minDocuments = parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1;
        const maxDocuments = parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5;
        
        // Generate tokens even without documents for limited access
        const tokens = this.generateTokens(user);
        
        // Delete password before returning
        delete user.password;
        
        logger.info(`User ${user.email} logged in but documents not uploaded`);
        
        return {
          requiresDocuments: true,
          message: 'Please upload required documents to complete your profile.',
          user: { 
            ...user, 
            userType: 'USER'
          },
          tokens, // Include tokens for document upload
          minDocuments,
          maxDocuments
        };
      }

      const tokens = this.generateTokens(user);
      delete user.password;

      logger.info(`User logged in: ${user.email}`);

      return {
        user: { ...user, userType: 'USER' },
        tokens
      };
    } catch (error) {
      logger.error('User login error:', error);
      throw error;
    }
  }

  /**
   * Verify login OTP for new device
   * 
   * @param {string} loginToken - Login token
   * @param {string} otp - OTP code
   * @param {string} ip - IP address
   * @param {string} deviceId - Device identifier (optional)
   * @param {string} fcmToken - Firebase Cloud Messaging token (optional)
   * @returns {Promise<Object>} User and tokens
   */
  async verifyLoginOTP(loginToken, otp, ip = null, deviceId = null, fcmToken = null) {
    try {
      // Verify login token
      const tokenData = OTPTokenService.verifyLoginToken(loginToken);

      // Verify OTP
      await OTPService.verifyOTP('login_verification', tokenData.phone, otp);

      // Find user
      const user = await UserRepository.findById(tokenData.userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Update last login and device info
      const updateData = {};
      if (ip) {
        updateData.lastLoginAt = new Date();
        updateData.lastLoginIp = ip;
      }
      if (deviceId) {
        updateData.lastDeviceId = deviceId;
      }
      if (fcmToken) {
        updateData.fcmToken = fcmToken;
      }
      
      if (Object.keys(updateData).length > 0) {
        await UserRepository.update(user.id, updateData);
      }

      // Check if documents uploaded
      if (!user.documentsUploaded) {
        const minDocuments = parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1;
        const maxDocuments = parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5;
        
        // Generate tokens even without documents for limited access
        const tokens = this.generateTokens(user);
        
        // Delete password before returning
        delete user.password;
        
        logger.info(`User ${user.email} verified OTP but documents not uploaded`);
        
        return {
          requiresDocuments: true,
          message: 'Please upload required documents to complete your profile.',
          user: { 
            ...user, 
            userType: 'USER'
          },
          tokens, // Include tokens for document upload
          minDocuments,
          maxDocuments
        };
      }

      // Generate tokens
      const tokens = this.generateTokens(user);
      delete user.password;

      logger.info(`User logged in after OTP verification: ${user.email}`);

      return {
        user: { ...user, userType: 'USER' },
        tokens
      };
    } catch (error) {
      logger.error('Login OTP verification error:', error);
      throw error;
    }
  }

  /**
   * Forgot password - send OTP
   * 
   * @param {string} email - User email
   * @param {boolean} returnOTP - Return OTP in response (dev mode)
   * @returns {Promise<Object>} Success message with password reset token
   */
  async forgotPassword(email, returnOTP = false) {
    try {
      const user = await UserRepository.findByEmail(email.toLowerCase());
      
      if (!user) {
        // Don't reveal if user exists (security)
        return {
          message: 'If your email is registered, you will receive an OTP to reset your password.',
          otpSent: true
        };
      }

      if (!user.phone) {
        throw ErrorHandlers.badRequest('errors.noPhoneNumber');
      }

      // Generate and store OTP
      const { otp, result: otpResult } = await OTPService.generateAndStore(
        'password_reset',
        user.phone,
        returnOTP
      );

      // Generate password reset token
      const resetToken = OTPTokenService.generateLoginToken({ // Reuse login token structure
        id: user.id,
        phone: user.phone,
        email: user.email
      });

      // Emit event to send OTP
      otpEventEmitter.emitOTPSend({
        phone: user.phone,
        otp,
        type: 'password_reset',
        userId: user.id,
        email: user.email
      });

      logger.info(`Password reset OTP sent to: ${user.phone}`);

      return {
        message: 'OTP sent to your registered phone number.',
        resetToken,
        phone: user.phone,
        ...otpResult
      };
    } catch (error) {
      logger.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with OTP
   * 
   * @param {string} resetToken - Password reset token
   * @param {string} otp - OTP code
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async resetPassword(resetToken, otp, newPassword) {
    try {
      // Verify reset token
      const tokenData = OTPTokenService.verifyToken(resetToken);

      // Verify OTP
      await OTPService.verifyOTP('password_reset', tokenData.phone, otp);

      // Find user
      const user = await UserRepository.findById(tokenData.userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      // Update password
      await UserRepository.update(user.id, {
        password: hashedPassword
      });

      logger.info(`Password reset successful for user: ${user.email}`);

      return {
        message: 'Password reset successfully. You can now login with your new password.'
      };
    } catch (error) {
      logger.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @param {number} userId - User ID
   * @returns {Promise<Object>} User profile
   */
  async getProfile(userId) {
    const user = await UserRepository.findById(userId);
    
    if (!user) {
      throw ErrorHandlers.notFound('errors.notFound');
    }

    return { user: { ...user, userType: 'USER' } };
  }

  /**
   * Change user password
   * @param {number} userId - User ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await UserRepository.findById(userId, true);
      
      if (!user) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      
      if (!isPasswordValid) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      await UserRepository.update(userId, {
        password: hashedPassword
      });

      logger.info(`Password changed for user ID: ${userId}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('User password change error:', error);
      throw error;
    }
  }

  /**
   * Get all users (Admin only)
   * @param {Object} filters - Filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated users
   */
  async getAllUsers(filters, page, limit) {
    return await UserRepository.findAll(filters, page, limit);
  }

  /**
   * Deactivate user (Admin only)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async deactivateUser(userId) {
    const user = await UserRepository.update(userId, { isActive: false });
    logger.info(`User ${user.email} deactivated`);
    return { user };
  }

  /**
   * Activate user (Admin only)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async activateUser(userId) {
    const user = await UserRepository.update(userId, { isActive: true });
    logger.info(`User ${user.email} activated`);
    return { user };
  }

  /**
   * Upload/Update user avatar
   * @param {number} userId - User ID
   * @param {string} avatarUrl - Avatar URL
   * @returns {Promise<Object>} Updated user
   */
  async updateAvatar(userId, avatarUrl) {
    try {
      const UploadService = require('./UploadService');
      
      const user = await UserRepository.findById(userId);
      
      if (!user) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      if (user.avatar) {
        UploadService.deleteFileByUrl(user.avatar);
      }

      const updatedUser = await UserRepository.update(userId, {
        avatar: avatarUrl
      });

      logger.info(`User avatar updated for user ID: ${userId}`);

      return { user: { ...updatedUser, userType: 'USER' } };
    } catch (error) {
      logger.error('User avatar update error:', error);
      throw error;
    }
  }

  /**
   * Delete user avatar
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Updated user
   */
  async deleteAvatar(userId) {
    try {
      const UploadService = require('./UploadService');
      
      const user = await UserRepository.findById(userId);
      
      if (!user) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      if (user.avatar) {
        UploadService.deleteFileByUrl(user.avatar);
      }

      const updatedUser = await UserRepository.update(userId, {
        avatar: null
      });

      logger.info(`User avatar deleted for user ID: ${userId}`);

      return { user: { ...updatedUser, userType: 'USER' } };
    } catch (error) {
      logger.error('User avatar deletion error:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens
   * @param {Object} user - User object
   * @returns {Object} Tokens
   */
  generateTokens(user) {
    const payload = {
      id: user.id,
      email: user.email,
      userType: 'USER',
      isActive: user.isActive
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'dubai-courts-api',
      audience: 'dubai-courts-client'
    });

    const refreshToken = jwt.sign(
      { id: user.id, userType: 'USER', type: 'refresh' },
      this.jwtRefreshSecret,
      {
        expiresIn: this.jwtRefreshExpiresIn,
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-client'
      }
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: this.jwtExpiresIn
    };
  }

  /**
   * Refresh user token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-client'
      });

      if (decoded.type !== 'refresh' || decoded.userType !== 'USER') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }

      const user = await UserRepository.findById(decoded.id);
      
      if (!user || !user.isActive) {
        throw ErrorHandlers.unauthorized('auth.accountDisabled');
      }

      const tokens = this.generateTokens(user);

      return { tokens };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }
      throw error;
    }
  }

  /**
   * Get user count
   * @returns {Promise<number>} Count
   */
  async getUserCount() {
    return await UserRepository.count();
  }

  /**
   * Generate secure token
   * @returns {string} Random token
   */
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }
  /**
   * Upload documents for user
   * @param {number} userId - User ID
   * @param {Array} files - Array of uploaded files from Multer
   * @returns {Promise<Object>} Updated user with documents
   */
  async uploadDocuments(userId, files) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Check minimum documents requirement
      const minDocuments = parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1;
      const maxDocuments = parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5;

      if (!files || files.length < minDocuments) {
        throw ErrorHandlers.badRequest('errors.minDocumentsRequired', {
          minDocuments
        });
      }

      // Check current document count
      const currentCount = await UserDocumentRepository.countByUserId(userId);
      const totalCount = currentCount + files.length;

      if (totalCount > maxDocuments) {
        throw ErrorHandlers.badRequest('errors.maxDocumentsExceeded', {
          maxDocuments,
          currentCount,
          attemptingToAdd: files.length
        });
      }

      const baseUrl = process.env.APP_URL || 'http://localhost:4000';
      const uploadedDocuments = [];

      // Save each document to database
      for (const file of files) {
        const document = await UserDocumentRepository.create({
          userId,
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `${baseUrl}/${file.path.replace(/\\/g, '/')}`,
          path: file.path,
          uploadedAt: new Date()
        });

        uploadedDocuments.push(document);
      }

      // Check if minimum requirements met
      const documentsUploaded = totalCount >= minDocuments;

      // Update user documents status
      await UserRepository.update(userId, {
        documentsUploaded
      });

      logger.info(`User ${userId} uploaded ${files.length} documents. Total: ${totalCount}`);

      return {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          documentsUploaded,
          documentsCount: totalCount
        },
        documents: uploadedDocuments
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error('Error uploading documents:', error);
      throw ErrorHandlers.internal('errors.documentUploadFailed');
    }
  }

  /**
   * Get user documents
   * @param {number} userId - User ID
   * @returns {Promise<Array>} User documents
   */
  async getDocuments(userId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      const documents = await UserDocumentRepository.findByUserId(userId);
      const count = documents.length;

      return {
        documents,
        documentsUploaded: user.documentsUploaded,
        documentsCount: count,
        minRequired: parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1,
        maxAllowed: parseInt(process.env.MAX_DOCUMENTS_COUNT) || 5
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error('Error getting documents:', error);
      throw ErrorHandlers.internal('errors.documentRetrievalFailed');
    }
  }

  /**
   * Delete a user document
   * @param {number} userId - User ID
   * @param {number} documentId - Document ID to delete
   * @returns {Promise<Object>} Updated documents
   */
  async deleteDocument(userId, documentId) {
    try {
      const user = await UserRepository.findById(userId);

      if (!user) {
        throw ErrorHandlers.notFound('errors.userNotFound');
      }

      // Find document
      const document = await UserDocumentRepository.findByIdAndUserId(documentId, userId);

      if (!document) {
        throw ErrorHandlers.notFound('errors.documentNotFound');
      }

      // Delete physical file
      const UploadService = require('./UploadService');
      try {
        await UploadService.deleteFile(document.filename, userId, 'USER');
      } catch (fileError) {
        logger.warn(`Failed to delete physical file: ${document.filename}`, fileError);
      }

      // Soft delete from database
      await UserDocumentRepository.softDelete(documentId);

      // Get remaining count
      const remainingCount = await UserDocumentRepository.countByUserId(userId);

      // Check if still meets minimum requirements
      const minDocuments = parseInt(process.env.MIN_DOCUMENTS_COUNT) || 1;
      const documentsUploaded = remainingCount >= minDocuments;

      // Update user status
      await UserRepository.update(userId, {
        documentsUploaded
      });

      logger.info(`User ${userId} deleted document ${documentId}. Remaining: ${remainingCount}`);

      return {
        message: 'Document deleted successfully',
        documentsCount: remainingCount,
        documentsUploaded
      };
    } catch (error) {
      if (error.isOperational) {
        throw error;
      }
      logger.error('Error deleting document:', error);
      throw ErrorHandlers.internal('errors.documentDeletionFailed');
    }
  }
}

module.exports = new UserService();

