const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const AdminRepository = require('@repositories/AdminRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * Admin Authentication Service
 * 
 * Handles admin authentication operations (login, token generation)
 * Separate from user authentication for security and clarity
 * Follows Single Responsibility Principle
 */
class AdminAuthService {
  /**
   * Admin login (email + password, no OTP)
   * @param {string} email - Admin email
   * @param {string} password - Admin password
   * @param {string} ip - Login IP address
   * @returns {Promise<Object>} Login result with tokens
   */
  async login(email, password, ip = null) {
    try {
      // Find admin by email with password
      const admin = await AdminRepository.findByEmail(email, true);
      
      if (!admin) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      // Check if admin is active
      if (!admin.isActive) {
        throw ErrorHandlers.forbidden('auth.accountInactive');
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      // Get admin roles and permissions
      const roles = await AdminRepository.getRoles(admin.id);
      const permissions = await AdminRepository.getPermissions(admin.id);

      // Update last login
      const updateData = {
        lastLoginAt: new Date()
      };
      
      if (ip) {
        updateData.lastLoginIp = ip;
      }
      
      await AdminRepository.update(admin.id, updateData);

      // Delete password before returning
      delete admin.password;

      // Generate tokens
      const tokens = this.generateTokens(admin, roles, permissions);

      logger.info(`Admin logged in: ${admin.email}`, { adminId: admin.id, ip });

      return {
        admin: {
          ...admin,
          userType: 'ADMIN',
          roles: roles.map(r => r.name),
          permissions: permissions.map(p => p.name)
        },
        tokens
      };
    } catch (error) {
      logger.error('Admin login error:', error);
      throw error;
    }
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data
   * @param {number} createdBy - Admin ID who created this admin
   * @returns {Promise<Object>} Created admin
   */
  async createAdmin(adminData, createdBy) {
    try {
      // Check if admin already exists
      const existingAdmin = await AdminRepository.findByEmail(adminData.email);
      if (existingAdmin) {
        throw ErrorHandlers.conflict('auth.emailAlreadyExists');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(adminData.password, 12);

      // Create admin
      const admin = await AdminRepository.create({
        ...adminData,
        password: hashedPassword,
        isActive: adminData.isActive !== undefined ? adminData.isActive : false,
        createdBy
      });

      logger.info(`Admin created: ${admin.email}`, {
        adminId: admin.id,
        createdBy
      });

      // Delete password before returning
      delete admin.password;

      return admin;
    } catch (error) {
      logger.error('Error creating admin:', error);
      throw error;
    }
  }

  /**
   * Update admin profile
   * @param {number} adminId - Admin ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated admin
   */
  async updateProfile(adminId, updateData) {
    try {
      const admin = await AdminRepository.findById(adminId);
      if (!admin) {
        throw ErrorHandlers.notFound('auth.adminNotFound');
      }

      // Check if email is being changed and if it's already taken
      if (updateData.email && updateData.email !== admin.email) {
        const existingAdmin = await AdminRepository.findByEmail(updateData.email);
        if (existingAdmin) {
          throw ErrorHandlers.conflict('auth.emailAlreadyExists');
        }
      }

      // Remove sensitive fields from update
      delete updateData.password;
      delete updateData.isActive;
      delete updateData.createdBy;

      const updatedAdmin = await AdminRepository.update(adminId, updateData);
      
      logger.info(`Admin profile updated: ${updatedAdmin.email}`, { adminId });

      return updatedAdmin;
    } catch (error) {
      logger.error('Error updating admin profile:', error);
      throw error;
    }
  }

  /**
   * Change admin password
   * @param {number} adminId - Admin ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<boolean>} Success status
   */
  async changePassword(adminId, currentPassword, newPassword) {
    try {
      const admin = await AdminRepository.findById(adminId, true);
      if (!admin) {
        throw ErrorHandlers.notFound('auth.adminNotFound');
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, admin.password);
      if (!isPasswordValid) {
        throw ErrorHandlers.unauthorized('auth.invalidCurrentPassword');
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update password
      await AdminRepository.update(adminId, { password: hashedPassword });

      logger.info(`Admin password changed: ${admin.email}`, { adminId });

      return true;
    } catch (error) {
      logger.error('Error changing admin password:', error);
      throw error;
    }
  }

  /**
   * Activate/Deactivate admin
   * @param {number} adminId - Admin ID
   * @param {boolean} isActive - Active status
   * @param {number} updatedBy - Admin ID who updated
   * @returns {Promise<Object>} Updated admin
   */
  async setAdminStatus(adminId, isActive, updatedBy) {
    try {
      const admin = await AdminRepository.findById(adminId);
      if (!admin) {
        throw ErrorHandlers.notFound('auth.adminNotFound');
      }

      const updatedAdmin = await AdminRepository.update(adminId, { isActive });

      logger.info(`Admin ${isActive ? 'activated' : 'deactivated'}: ${admin.email}`, {
        adminId,
        updatedBy
      });

      return updatedAdmin;
    } catch (error) {
      logger.error('Error setting admin status:', error);
      throw error;
    }
  }

  /**
   * Get admin with roles and permissions
   * @param {number} adminId - Admin ID
   * @returns {Promise<Object>} Admin with roles and permissions
   */
  async getAdminProfile(adminId) {
    try {
      const admin = await AdminRepository.findById(adminId);
      if (!admin) {
        throw ErrorHandlers.notFound('auth.adminNotFound');
      }

      const roles = await AdminRepository.getRoles(adminId);
      const permissions = await AdminRepository.getPermissions(adminId);

      return {
        ...admin,
        roles,
        permissions: permissions.map(p => p.name)
      };
    } catch (error) {
      logger.error('Error getting admin profile:', error);
      throw error;
    }
  }

  /**
   * Get all admins
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of admins
   */
  async getAllAdmins(filters = {}) {
    try {
      return await AdminRepository.findAll(filters);
    } catch (error) {
      logger.error('Error getting admins:', error);
      throw error;
    }
  }

  /**
   * Delete admin (soft delete)
   * @param {number} adminId - Admin ID
   * @param {number} deletedBy - Admin ID who deleted
   * @returns {Promise<boolean>} Success status
   */
  async deleteAdmin(adminId, deletedBy) {
    try {
      const admin = await AdminRepository.findById(adminId);
      if (!admin) {
        throw ErrorHandlers.notFound('auth.adminNotFound');
      }

      // Prevent deleting self
      if (adminId === deletedBy) {
        throw ErrorHandlers.forbidden('auth.cannotDeleteSelf');
      }

      const success = await AdminRepository.softDelete(adminId);

      logger.info(`Admin deleted: ${admin.email}`, { adminId, deletedBy });

      return success;
    } catch (error) {
      logger.error('Error deleting admin:', error);
      throw error;
    }
  }

  /**
   * Generate JWT tokens for admin
   * @param {Object} admin - Admin object
   * @param {Array} roles - Admin roles
   * @param {Array} permissions - Admin permissions
   * @returns {Object} Access and refresh tokens
   * @private
   */
  generateTokens(admin, roles = [], permissions = []) {
    const payload = {
      id: admin.id,
      email: admin.email,
      userType: 'ADMIN',
      roles: roles.map(r => r.name),
      permissions: permissions.map(p => p.name)
    };

    const accessToken = jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_ACCESS_EXPIRY || '1d' }
    );

    const refreshToken = jwt.sign(
      { id: admin.id, userType: 'ADMIN' },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d' }
    );

    return {
      accessToken,
      refreshToken
    };
  }

  /**
   * Refresh access token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      if (decoded.userType !== 'ADMIN') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }

      const admin = await AdminRepository.findById(decoded.id);
      if (!admin || !admin.isActive) {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }

      const roles = await AdminRepository.getRoles(admin.id);
      const permissions = await AdminRepository.getPermissions(admin.id);

      const tokens = this.generateTokens(admin, roles, permissions);

      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw ErrorHandlers.unauthorized('auth.invalidToken');
    }
  }
}

module.exports = new AdminAuthService();

