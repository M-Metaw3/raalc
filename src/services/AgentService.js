const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const AgentRepository = require('@repositories/AgentRepository');
const ShiftRepository = require('@repositories/ShiftRepository');
const DepartmentRepository = require('@repositories/DepartmentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * Agent Service
 * 
 * Handles all agent-related business logic
 * Agents require admin approval before activation
 */
class AgentService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET;
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';
    this.jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
    this.jwtRefreshExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
    this.saltRounds = 12;
  }

  /**
   * Register a new agent
   * @param {Object} agentData - Agent data
   * @returns {Promise<Object>} Created agent (pending approval)
   */
  async register(agentData) {
    try {
      // Check if email already exists
      const existingAgent = await AgentRepository.findByEmail(agentData.email);
      if (existingAgent) {
        throw ErrorHandlers.conflict('auth.emailAlreadyExists');
      }

      // Validate shiftId if provided
      if (agentData.shiftId) {
        const shift = await ShiftRepository.findById(agentData.shiftId);
        if (!shift) {
          throw ErrorHandlers.badRequest('errors.shiftNotFound');
        }
        if (!shift.isActive) {
          throw ErrorHandlers.badRequest('errors.shiftNotActive');
        }
      }

      // Validate departmentId if provided
      if (agentData.departmentId) {
        const department = await DepartmentRepository.findById(agentData.departmentId);
        if (!department) {
          throw ErrorHandlers.badRequest('errors.departmentNotFound');
        }
        if (!department.isActive) {
          throw ErrorHandlers.badRequest('errors.departmentNotActive');
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(agentData.password, this.saltRounds);

      // Generate email verification token
      const emailVerificationToken = this.generateSecureToken();
      const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Create agent - inactive by default (requires admin approval)
      const agent = await AgentRepository.create({
        fullName: agentData.fullName,
        email: agentData.email.toLowerCase(),
        password: hashedPassword,
        phone: agentData.phone,
        createdBy: agentData.createdBy || null,
        licenseNumber: agentData.licenseNumber || null,
        agencyName: agentData.agencyName || null,
        shiftId: agentData.shiftId || null,
        departmentId: agentData.departmentId || null,
        isActive: false,
        isEmailVerified: false,
        emailVerificationToken,
        emailVerificationExpires
      });

      delete agent.password;
      delete agent.emailVerificationToken;

      logger.info(`New agent registered (pending approval): ${agent.email}`);

      // TODO: Notify admins
      // await notificationQueue.add('newAgentRegistration', { agentId: agent.id });

      return {
        agent: { ...agent, userType: 'AGENT' },
        message: 'Registration successful. Your account is pending admin approval.'
      };
    } catch (error) {
      logger.error('Agent registration error:', error);
      throw error;
    }
  }

  /**
   * Agent login
   * @param {string} email - Agent email
   * @param {string} password - Agent password
   * @param {string} ip - IP address
   * @returns {Promise<Object>} Agent and tokens
   */
  async login(identifier, password, ip = null) {
    try {
      // Support both email and phone login
      const agent = await AgentRepository.findByEmailOrPhone(identifier, true);
      
      if (!agent) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      if (!agent.isActive) {
        throw ErrorHandlers.forbidden('auth.accountPendingApproval');
      }

      const isPasswordValid = await bcrypt.compare(password, agent.password);
      
      if (!isPasswordValid) {
        logger.warn(`Failed agent login attempt for: ${identifier} from IP: ${ip}`);
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      if (ip) {
        await AgentRepository.updateLastLogin(agent.id, ip);
      }

      const tokens = this.generateTokens(agent);
      delete agent.password;

      logger.info(`Agent logged in: ${agent.email}`);

      return {
        agent: { ...agent, userType: 'AGENT' },
        tokens
      };
    } catch (error) {
      logger.error('Agent login error:', error);
      throw error;
    }
  }

  /**
   * Get agent profile
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Agent profile
   */
  async getProfile(agentId) {
    const agent = await AgentRepository.findById(agentId);
    
    if (!agent) {
      throw ErrorHandlers.notFound('errors.notFound');
    }

    return { agent: { ...agent, userType: 'AGENT' } };
  }

  /**
   * Change agent password
   * @param {number} agentId - Agent ID
   * @param {string} currentPassword - Current password
   * @param {string} newPassword - New password
   * @returns {Promise<Object>} Success message
   */
  async changePassword(agentId, currentPassword, newPassword) {
    try {
      const agent = await AgentRepository.findById(agentId, true);
      
      if (!agent) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, agent.password);
      
      if (!isPasswordValid) {
        throw ErrorHandlers.unauthorized('auth.invalidCredentials');
      }

      const hashedPassword = await bcrypt.hash(newPassword, this.saltRounds);

      await AgentRepository.update(agentId, {
        password: hashedPassword
      });

      logger.info(`Password changed for agent ID: ${agentId}`);

      return { message: 'Password changed successfully' };
    } catch (error) {
      logger.error('Agent password change error:', error);
      throw error;
    }
  }

  /**
   * Get all agents (Admin only)
   * @param {Object} filters - Filters (isActive, search, etc.)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated agents
   */
  async getAllAgents(filters, page, limit) {
    const skip = (page - 1) * limit;
    return await AgentRepository.findAll({
      where: filters,
      skip,
      limit
    });
  }

  /**
   * Get pending agents (Admin only)
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated pending agents
   */
  async getPendingAgents(page, limit) {
    return await AgentRepository.findPendingAgents(page, limit);
  }

  /**
   * Approve agent (Admin only)
   * @param {number} agentId - Agent ID
   * @param {number} adminId - Admin ID
   * @returns {Promise<Object>} Updated agent
   */
  async approveAgent(agentId, adminId) {
    try {
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      if (agent.isActive) {
        throw ErrorHandlers.badRequest('Agent is already active');
      }

      const updatedAgent = await AgentRepository.update(agentId, {
        isActive: true,
        approvedBy: adminId,
        approvedAt: new Date(),
        rejectedBy: null,
        rejectedAt: null,
        rejectionReason: null
      });

      logger.info(`Agent ${agent.email} approved by admin ID: ${adminId}`);

      // TODO: Send approval email
      // await emailQueue.add('agentApproved', { agentId: agent.id });

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent approval error:', error);
      throw error;
    }
  }

  /**
   * Reject agent (Admin only)
   * @param {number} agentId - Agent ID
   * @param {number} adminId - Admin ID
   * @param {string} reason - Rejection reason
   * @returns {Promise<Object>} Updated agent
   */
  async rejectAgent(agentId, adminId, reason) {
    try {
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      if (agent.isActive) {
        throw ErrorHandlers.badRequest('Cannot reject an active agent');
      }

      const updatedAgent = await AgentRepository.update(agentId, {
        rejectedBy: adminId,
        rejectedAt: new Date(),
        rejectionReason: reason
      });

      logger.info(`Agent ${agent.email} rejected by admin ID: ${adminId}`);

      // TODO: Send rejection email
      // await emailQueue.add('agentRejected', { agentId: agent.id, reason });

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent rejection error:', error);
      throw error;
    }
  }

  /**
   * Deactivate agent (Admin only)
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Updated agent
   */
  async deactivateAgent(agentId) {
    const agent = await AgentRepository.update(agentId, { isActive: false });
    logger.info(`Agent ${agent.email} deactivated`);
    return { agent };
  }

  /**
   * Activate agent (Admin only)
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Updated agent
   */
  async activateAgent(agentId) {
    const agent = await AgentRepository.update(agentId, { isActive: true });
    logger.info(`Agent ${agent.email} activated`);
    return { agent };
  }

  /**
   * Generate JWT tokens
   * @param {Object} agent - Agent object
   * @returns {Object} Tokens
   */
  generateTokens(agent) {
    const payload = {
      id: agent.id,
      email: agent.email,
      userType: 'AGENT',
      isActive: agent.isActive
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn,
      issuer: 'dubai-courts-api',
      audience: 'dubai-courts-client'
    });

    const refreshToken = jwt.sign(
      { id: agent.id, userType: 'AGENT', type: 'refresh' },
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
   * Refresh agent token
   * @param {string} refreshToken - Refresh token
   * @returns {Promise<Object>} New tokens
   */
  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, this.jwtRefreshSecret, {
        issuer: 'dubai-courts-api',
        audience: 'dubai-courts-client'
      });

      if (decoded.type !== 'refresh' || decoded.userType !== 'AGENT') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }

      const agent = await AgentRepository.findById(decoded.id);
      
      if (!agent || !agent.isActive) {
        throw ErrorHandlers.unauthorized('auth.accountDisabled');
      }

      const tokens = this.generateTokens(agent);

      return { tokens };
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw ErrorHandlers.unauthorized('auth.invalidToken');
      }
      throw error;
    }
  }

  /**
   * Get agent count
   * @returns {Promise<number>} Count
   */
  async getAgentCount() {
    return await AgentRepository.count();
  }

  /**
   * Upload/Update agent avatar
   * @param {number} agentId - Agent ID
   * @param {string} avatarUrl - Avatar URL
   * @returns {Promise<Object>} Updated agent
   */
  async updateAvatar(agentId, avatarUrl) {
    try {
      const UploadService = require('./UploadService');
      
      // Get current agent to delete old avatar
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      // Delete old avatar if exists
      if (agent.avatar) {
        UploadService.deleteFileByUrl(agent.avatar);
      }

      // Update with new avatar
      const updatedAgent = await AgentRepository.update(agentId, {
        avatar: avatarUrl
      });

      logger.info(`Agent avatar updated for agent ID: ${agentId}`);

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent avatar update error:', error);
      throw error;
    }
  }

  /**
   * Delete agent avatar
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Updated agent
   */
  async deleteAvatar(agentId) {
    try {
      const UploadService = require('./UploadService');
      
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('errors.notFound');
      }

      // Delete avatar file
      if (agent.avatar) {
        UploadService.deleteFileByUrl(agent.avatar);
      }

      // Remove avatar from database
      const updatedAgent = await AgentRepository.update(agentId, {
        avatar: null
      });

      logger.info(`Agent avatar deleted for agent ID: ${agentId}`);

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent avatar deletion error:', error);
      throw error;
    }
  }

  /**
   * Update agent (Admin or Agent self)
   * @param {number} agentId - Agent ID
   * @param {Object} updates - Fields to update
   * @param {boolean} isSelf - Is agent updating own profile
   * @returns {Promise<Object>} Updated agent
   */
  async updateAgent(agentId, updates, isSelf = false) {
    try {
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('agent.notFound');
      }

      // Define allowed updates based on who is updating
      let allowedUpdates;
      if (isSelf) {
        // Agent can only update their own basic info
        allowedUpdates = ['fullName', 'phone', 'email', 'licenseNumber', 'agencyName'];
      } else {
        // Admin can update everything
        allowedUpdates = ['fullName', 'phone', 'email', 'shiftId', 'departmentId', 'isActive', 'featured', 'licenseNumber', 'agencyName'];
      }
      
      const filteredUpdates = {};
      
      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          filteredUpdates[key] = updates[key];
        }
      }

      // Check if email is being updated and already exists
      if (filteredUpdates.email) {
        const existingAgent = await AgentRepository.findByEmail(filteredUpdates.email);
        if (existingAgent && existingAgent.id !== agentId) {
          throw ErrorHandlers.conflict('auth.emailAlreadyExists');
        }
        filteredUpdates.email = filteredUpdates.email.toLowerCase();
      }

      const updatedAgent = await AgentRepository.update(agentId, filteredUpdates);
      
      logger.info(`Agent updated: ${agentId}`, { by: isSelf ? 'self' : 'admin', fields: Object.keys(filteredUpdates) });

      return { ...updatedAgent, userType: 'AGENT' };
    } catch (error) {
      logger.error('Update agent error:', error);
      throw error;
    }
  }

  /**
   * Upload agent avatar
   * @param {number} agentId - Agent ID
   * @param {Object} file - Multer file object
   * @returns {Promise<Object>} Updated agent with avatar URL
   */
  async uploadAvatar(agentId, file) {
    try {
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('agent.notFound');
      }

      // Delete old avatar if exists
      if (agent.avatar) {
        const oldPath = agent.avatar.replace(process.env.APP_URL + '/', '');
        const fs = require('fs').promises;
        try {
          await fs.unlink(oldPath);
        } catch (err) {
          logger.warn(`Could not delete old avatar: ${oldPath}`);
        }
      }

      // Build full avatar URL
      const avatarUrl = `${process.env.APP_URL}/${file.path.replace(/\\/g, '/')}`;

      // Update agent avatar
      const updatedAgent = await AgentRepository.update(agentId, {
        avatar: avatarUrl
      });

      logger.info(`Agent avatar uploaded for agent ID: ${agentId}`);

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent avatar upload error:', error);
      throw error;
    }
  }

  /**
   * Delete agent avatar
   * @param {number} agentId - Agent ID
   * @returns {Promise<Object>} Updated agent
   */
  async deleteAvatar(agentId) {
    try {
      const agent = await AgentRepository.findById(agentId);
      
      if (!agent) {
        throw ErrorHandlers.notFound('agent.notFound');
      }

      if (!agent.avatar) {
        throw ErrorHandlers.badRequest('agent.noAvatar');
      }

      // Delete avatar file
      const avatarPath = agent.avatar.replace(process.env.APP_URL + '/', '');
      const fs = require('fs').promises;
      try {
        await fs.unlink(avatarPath);
      } catch (err) {
        logger.warn(`Could not delete avatar file: ${avatarPath}`);
      }

      // Update agent avatar to null
      const updatedAgent = await AgentRepository.update(agentId, {
        avatar: null
      });

      logger.info(`Agent avatar deleted for agent ID: ${agentId}`);

      return { agent: { ...updatedAgent, userType: 'AGENT' } };
    } catch (error) {
      logger.error('Agent avatar deletion error:', error);
      throw error;
    }
  }

  /**
   * Get featured agents
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Featured agents list
   */
  async getFeaturedAgents(options = {}) {
    try {
      const { page = 1, limit = 10 } = options;
      const skip = (page - 1) * limit;

      const result = await AgentRepository.findAll({
        where: { featured: true, isActive: true },
        skip,
        limit,
        relations: ['department', 'shift']
      });

      return {
        agents: result.data.map(agent => ({
          ...agent,
          userType: 'AGENT',
          // Ensure avatar has full URL
          avatar: agent.avatar || null
        })),
        pagination: result.pagination
      };
    } catch (error) {
      logger.error('Get featured agents error:', error);
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

module.exports = new AgentService();

