const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AdminRepository = require('@repositories/AdminRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * Admin Service
 * 
 * Handles all admin-related business logic
 */
class AdminService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    this.saltRounds = 12;
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data
   * @param {number} creatorId - ID of the admin creating this account
   * @returns {Promise<Object>} Created admin
   */
  async createAdmin(adminData, creatorId) {
    try {
      // Check if email already exists
      const existingAdmin = await AdminRepository.findByEmail(adminData.email);
      if (existingAdmin) {
        throw ErrorHandlers.conflict('auth.emailAlreadyExists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, this.saltRounds);

      // Create admin
      const admin = await AdminRepository.create({
        firstName: adminData.firstName,
        lastName: adminData.lastName,
        email: adminData.email.toLowerCase(),
        password: hashedPassword,
        phone: adminData.phone || null,
        isActive: true,
        isSuperAdmin: false,
        createdBy: creatorId
      });

      delete admin.password;

      logger.info(`New admin created: ${admin.email} by admin ID: ${creatorId}`);

      return { admin: { ...admin, userType: 'ADMIN' } };
    } catch (error) {
      logger.error('Admin creation error:', error);
      throw error;
    }
  }

  /**
   * Admin login
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Admin and tokens
   */
  async login(email, password, ip = null) {
    try {
      const admin = await AdminRepository.findByEmail(email.toLowerCase(), true);
      
      if (!admin) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      if (!admin.isActive) {
        throw ErrorHandlers.forbidden('auth.accountDisabled');
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      
      if (!isPasswordValid) {
        logger.warn(`Failed admin login attempt for: ${email} from IP: ${ip}`);
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      if (ip) {
        await AdminRepository.updateLastLogin(admin.id, ip);
      }

      const tokens = this.generateTokens(admin);
      delete admin.password;

      logger.info(`Admin logged in: ${admin.email}`);

      return {
        admin: { ...admin, userType: 'ADMIN' },
        tokens
      };
    } catch (error) {
      logger.error('Admin login error:', error);
      throw error;
    }
  }

  /**
   * Get admin profile
   * @param {number} adminId - Admin ID
   * @returns {Promise<Object>} Admin profile
   */
  async getProfile(adminId) {
    const admin = await AdminRepository.findById(adminId);
    
    if (!admin) {
      throw ErrorHandlers.notFound('errors.notFound');
    }

    return { admin: { ...admin, userType: 'ADMIN' } };
  }

  /**
   * Change admin password
   * @param {number} adminId - Admin ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await AdminRepository.findById(adminId, true);
      
      if (!admin) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      
      if (!isPasswordValid) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      await AdminRepository.update(adminId, {
        password: hashedPassword
      });

      logger.info(`Password changed for admin ID: ${adminId}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Admin password change error:', error);
      throw error;
    }
  }

  /**
   * Get all admins
   * @param {Object} filters - Filters
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated admins
   */
  async getAllAdmins(filters, page, limit) {
    return await AdminRepository.findAll(filters, page, limit);
  }

  /**
   * Deactivate admin
   * @param {number} adminId - Admin ID to deactivate
   * @returns {Promise<Object>} Updated admin
   */
  async deactivateAdmin(adminId) {
    const admin = await AdminRepository.update(adminId, { isActive: false });
    logger.info(`Admin ${admin.email} deactivated`);
    return { admin };
  }

  /**
   * Activate admin
   * @param {number} adminId - Admin ID to activate
   * @returns {Promise<Object>} Updated admin
   */
  async activateAdmin(adminId) {
    const admin = await AdminRepository.update(adminId, { isActive: true });
    logger.info(`Admin ${admin.email} activated`);
    return { admin };
  }

  /**
   * Generate JWT tokens
   * @param {Object} admin - Admin object
   * @returns {Object} Tokens
   */
  generateTokens(admin) {
    const payload = {
      id: admin.id,
      email: admin.email,
      userType: 'ADMIN',
      isActive: admin.isActive,
      isSuperAdmin: admin.isSuperAdmin
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'dubai-courts-api',
      audience: 'dubai-courts-client'
    });

    const refreshToken = jwt.sign(
      { id: admin.id, userType: 'ADMIN', type: 'refresh' },
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
   * Refresh admin token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-client'
      });

      if (decoded.type !== 'refresh' || decoded.userType !== 'ADMIN') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }

      const admin = await AdminRepository.findById(decoded.id);
      
      if (!admin || !admin.isActive) {
        throw ErrorHandlers.unauthorized('auth.accountDisabled');
      }

      const tokens = this.generateTokens(admin);

      return { tokens };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }
      throw error;
    }
  }

  /**
   * Upload/Update admin avatar
   * @param {number} adminId - Admin ID
   * @param {string} avatarUrl - Avatar URL
   * @returns {Promise<Object>} Updated admin
   */
  async updateAvatar(adminId, avatarUrl) {
    try {
      const UploadService = require('./UploadService');
      
      // Get current admin to delete old avatar
      const admin = await AdminRepository.findById(adminId);
      
      if (!admin) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      // Delete old avatar if exists
      if (admin.avatar) {
        UploadService.deleteFileByUrl(admin.avatar);
      }

      // Update with new avatar
      const updatedAdmin = await AdminRepository.update(adminId, {
        avatar: avatarUrl
      });

      logger.info(`Admin avatar updated for admin ID: ${adminId}`);

      return { admin: { ...updatedAdmin, userType: 'ADMIN' } };
    } catch (error) {
      logger.error('Admin avatar update error:', error);
      throw error;
    }
  }

  /**
   * Delete admin avatar
   * @param {number} adminId - Admin ID
   * @returns {Promise<Object>} Updated admin
   */
  async deleteAvatar(adminId) {
    try {
      const UploadService = require('./UploadService');
      
      const admin = await AdminRepository.findById(adminId);
      
      if (!admin) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      // Delete avatar file
      if (admin.avatar) {
        UploadService.deleteFileByUrl(admin.avatar);
      }

      // Remove avatar from database
      const updatedAdmin = await AdminRepository.update(adminId, {
        avatar: null
      });

      logger.info(`Admin avatar deleted for admin ID: ${adminId}`);

      return { admin: { ...updatedAdmin, userType: 'ADMIN' } };
    } catch (error) {
      logger.error('Admin avatar deletion error:', error);
      throw error;
    }
  }

  /**
   * Generate secure token
   * @returns {string} Random token
   */
  generateSecureToken() {
    return crypto.randomBytes(32).toString('hex');
  }
}

module.exports = new AdminService();

