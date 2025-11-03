const AgentService = require('@services/AgentService');

/**
 * Agent Controller
 * 
 * Handles all agent-related HTTP requests
 */
class AgentController {
  /**
   * Register a new agent
   * POST /api/agents/register
   * 
   * @access Public
   * @note Requires admin approval
   */
  async register(req, res, next) {
    try {
      const { fullName, email, password, phone, licenseNumber, agencyName } = req.body;

      const result = await AgentService.register({
        fullName,
        email,
        password,
        phone,
        licenseNumber,
        agencyName
      });

      res.status(201).json({
        ok: true,
        message: req.t('auth.agentRegistrationPending'),
        messageKey: 'auth.agentRegistrationPending',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Agent login
   * POST /api/agents/login
   * 
   * @access Public
   */
  async login(req, res, next) {
    try {
      const { email, identifier, password } = req.body;
      const loginIdentifier = identifier || email; // Support both formats
      const ip = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress;

      const result = await AgentService.login(loginIdentifier, password, ip);

      res.json({
        ok: true,
        message: req.t('auth.loginSuccess'),
        messageKey: 'auth.loginSuccess',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get agent profile
   * GET /api/agents/me
   * 
   * @access Private - Agent only
   */
  async getProfile(req, res, next) {
    try {
      const agentId = req.user.id;
      const result = await AgentService.getProfile(agentId);

      res.json({
        ok: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change agent password
   * POST /api/agents/change-password
   * 
   * @access Private - Agent only
   */
  async changePassword(req, res, next) {
    try {
      const agentId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      const result = await AgentService.changePassword(
        agentId,
        currentPassword,
        newPassword
      );

      res.json({
        ok: true,
        message: req.t('auth.passwordChanged'),
        messageKey: 'auth.passwordChanged',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh agent token
   * POST /api/agents/refresh-token
   * 
   * @access Public
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;
      const result = await AgentService.refreshToken(refreshToken);

      res.json({
        ok: true,
        message: req.t('auth.tokenRefreshed'),
        messageKey: 'auth.tokenRefreshed',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all agents (Admin only)
   * GET /api/agents/list
   * 
   * @access Private - Admin only
   */
  async getAllAgents(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const filters = {
        isActive: req.query.isActive === 'true' ? true : 
                  req.query.isActive === 'false' ? false : undefined,
        search: req.query.search
      };

      const result = await AgentService.getAllAgents(filters, page, limit);

      res.json({
        ok: true,
        data: {
          agents: result.data,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get pending agents (Admin only)
   * GET /api/agents/pending
   * 
   * @access Private - Admin only
   */
  async getPendingAgents(req, res, next) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await AgentService.getPendingAgents(page, limit);

      res.json({
        ok: true,
        data: {
          agents: result.data,
          count: result.total,
          pagination: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Approve agent (Admin only)
   * POST /api/agents/:agentId/approve
   * 
   * @access Private - Admin only
   */
  async approveAgent(req, res, next) {
    try {
      const { agentId } = req.params;
      const adminId = req.user.id;

      const result = await AgentService.approveAgent(
        parseInt(agentId),
        adminId
      );

      res.json({
        ok: true,
        message: req.t('auth.agentApproved'),
        messageKey: 'auth.agentApproved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Reject agent (Admin only)
   * POST /api/agents/:agentId/reject
   * 
   * @access Private - Admin only
   */
  async rejectAgent(req, res, next) {
    try {
      const { agentId } = req.params;
      const { reason } = req.body;
      const adminId = req.user.id;

      const result = await AgentService.rejectAgent(
        parseInt(agentId),
        adminId,
        reason || 'No reason provided'
      );

      res.json({
        ok: true,
        message: req.t('auth.agentRejected'),
        messageKey: 'auth.agentRejected',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate agent (Admin only)
   * POST /api/agents/:agentId/deactivate
   * 
   * @access Private - Admin only
   */
  async deactivateAgent(req, res, next) {
    try {
      const { agentId } = req.params;
      const result = await AgentService.deactivateAgent(parseInt(agentId));

      res.json({
        ok: true,
        message: req.t('auth.userDeactivated'),
        messageKey: 'auth.userDeactivated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate agent (Admin only)
   * POST /api/agents/:agentId/activate
   * 
   * @access Private - Admin only
   */
  async activateAgent(req, res, next) {
    try {
      const { agentId } = req.params;
      const result = await AgentService.activateAgent(parseInt(agentId));

      res.json({
        ok: true,
        message: req.t('auth.userActivated'),
        messageKey: 'auth.userActivated',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload agent avatar
   * PATCH /api/agents/avatar
   * 
   * @access Private - Agent only
   */
  async uploadAvatar(req, res, next) {
    try {
      const agentId = req.user.id;
      const UploadService = require('@services/UploadService');

      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: req.t('errors.fileRequired'),
          messageKey: 'errors.fileRequired',
          statusCode: 400
        });
      }

      // Get file URL
      const avatarUrl = UploadService.getFileUrl(req.file.path);

      // Update agent avatar
      const result = await AgentService.updateAvatar(agentId, avatarUrl);

      res.json({
        ok: true,
        message: req.t('success.avatarUploaded'),
        messageKey: 'success.avatarUploaded',
        data: {
          agent: result.agent,
          file: {
            filename: req.file.filename,
            url: avatarUrl,
            size: req.file.size
          }
        }
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        const UploadService = require('@services/UploadService');
        UploadService.cleanupFiles(req.file);
      }
      next(error);
    }
  }

  /**
   * Delete agent avatar
   * DELETE /api/agents/avatar
   * 
   * @access Private - Agent only
   */
  async deleteAvatar(req, res, next) {
    try {
      const agentId = req.user.id;
      const result = await AgentService.deleteAvatar(agentId);

      res.json({
        ok: true,
        message: req.t('success.avatarDeleted'),
        messageKey: 'success.avatarDeleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update agent profile
   * PUT /api/agents/profile (self) or PUT /api/agents/:id (admin)
   * 
   * @access Private - Agent (self) or Admin with permission
   */
  async updateAgent(req, res, next) {
    try {
      const agentId = req.params.id ? parseInt(req.params.id) : req.user.id;
      const updates = req.body;
      const isSelf = req.user.id === agentId && req.user.userType === 'AGENT';

      const result = await AgentService.updateAgent(agentId, updates, isSelf);

      res.json({
        ok: true,
        message: req.t('success.updated'),
        messageKey: 'success.updated',
        data: { agent: result }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload agent avatar
   * POST /api/agents/avatar (self) or POST /api/agents/:id/avatar (admin)
   * 
   * @access Private - Agent (self) or Admin
   */
  async uploadAvatar(req, res, next) {
    try {
      const agentId = req.params.id ? parseInt(req.params.id) : req.user.id;
      
      if (!req.file) {
        throw ErrorHandlers.badRequest('errors.fileRequired');
      }

      const result = await AgentService.uploadAvatar(agentId, req.file);

      res.json({
        ok: true,
        message: req.t('success.avatarUploaded'),
        messageKey: 'success.avatarUploaded',
        data: result
      });
    } catch (error) {
      // Delete uploaded file if error occurs
      if (req.file) {
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (err) {
          // Ignore deletion errors
        }
      }
      next(error);
    }
  }

  /**
   * Delete agent avatar
   * DELETE /api/agents/avatar (self) or DELETE /api/agents/:id/avatar (admin)
   * 
   * @access Private - Agent (self) or Admin
   */
  async deleteAvatar(req, res, next) {
    try {
      const agentId = req.params.id ? parseInt(req.params.id) : req.user.id;
      const result = await AgentService.deleteAvatar(agentId);

      res.json({
        ok: true,
        message: req.t('success.avatarDeleted'),
        messageKey: 'success.avatarDeleted',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create agent (Admin only)
   * POST /api/agents/create
   * 
   * @access Private - Admin only
   */
  async createAgent(req, res, next) {
    try {
      const agentData = {
        ...req.body,
        createdBy: req.user.id // Store admin ID who created the agent
      };

      const result = await AgentService.register(agentData);

      res.status(201).json({
        ok: true,
        message: req.t('agent.createdSuccessfully'),
        messageKey: 'agent.createdSuccessfully',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Toggle agent featured status (Admin only)
   * PATCH /api/agents/:id/featured
   * 
   * @access Private - Admin only
   */
  async toggleFeatured(req, res, next) {
    try {
      const agentId = parseInt(req.params.id);
      const { featured } = req.body;

      const result = await AgentService.updateAgent(agentId, { featured }, false);

      res.json({
        ok: true,
        message: req.t('agent.featuredUpdated'),
        messageKey: 'agent.featuredUpdated',
        data: { agent: result }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get featured agents (Public)
   * GET /api/agents/featured
   * 
   * @access Public
   */
  async getFeaturedAgents(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const result = await AgentService.getFeaturedAgents({ page: parseInt(page), limit: parseInt(limit) });

      res.json({
        ok: true,
        message: req.t('agent.featuredRetrieved'),
        messageKey: 'agent.featuredRetrieved',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AgentController();

