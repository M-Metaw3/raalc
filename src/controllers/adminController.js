const AdminAuthService = require('@services/AdminAuthService');
const RBACService = require('@services/RBACService');
const UploadService = require('@services/UploadService');
const logger = require('@utils/logger');

/**
 * Admin Controller
 * 
 * Handles admin-related HTTP requests
 * Uses services for business logic (follows Single Responsibility)
 */
class AdminController {
  /**
   * Admin login
   * POST /api/admins/login
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const ip = req.headers['x-forwarded-for'] || 
                 req.connection.remoteAddress || 
                 req.socket.remoteAddress;

      const result = await AdminAuthService.login(email, password, ip);

      res.json({
        ok: true,
        message: req.t('auth.loginSuccess'),
        messageKey: 'auth.loginSuccess',
        data: result
      });
    } catch (error) {
      logger.error('Admin login error:', error);
      next(error);
    }
  }

  /**
   * Create new admin
   * POST /api/admins
   */
  async createAdmin(req, res, next) {
    try {
      const adminData = req.body;
      const createdBy = req.user.id;

      const admin = await AdminAuthService.createAdmin(adminData, createdBy);

      // Assign roles if provided
      if (req.body.roleIds && req.body.roleIds.length > 0) {
        await RBACService.assignRolesToAdmin(admin.id, req.body.roleIds, createdBy);
      }

      res.status(201).json({
        ok: true,
        message: req.t('auth.adminCreated'),
        messageKey: 'auth.adminCreated',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin profile
   * GET /api/admins/profile
   */
  async getProfile(req, res, next) {
    try {
      const adminId = req.user.id;
      const profile = await AdminAuthService.getAdminProfile(adminId);

      res.json({
        ok: true,
        message: req.t('auth.profileRetrieved'),
        messageKey: 'auth.profileRetrieved',
        data: { admin: profile }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update admin profile
   * PATCH /api/admins/profile
   */
  async updateProfile(req, res, next) {
    try {
      const adminId = req.user.id;
      const updateData = req.body;

      const admin = await AdminAuthService.updateProfile(adminId, updateData);

      res.json({
        ok: true,
        message: req.t('auth.profileUpdated'),
        messageKey: 'auth.profileUpdated',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Change password
   * POST /api/admins/change-password
   */
  async changePassword(req, res, next) {
    try {
      const adminId = req.user.id;
      const { currentPassword, newPassword } = req.body;

      await AdminAuthService.changePassword(adminId, currentPassword, newPassword);

      res.json({
        ok: true,
        message: req.t('auth.passwordChanged'),
        messageKey: 'auth.passwordChanged',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Upload avatar
   * POST /api/admins/avatar
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return res.status(400).json({
          ok: false,
          message: req.t('errors.noFileUploaded'),
          messageKey: 'errors.noFileUploaded'
        });
      }

      const adminId = req.user.id;
      const admin = await AdminAuthService.getAdminProfile(adminId);

      // Delete old avatar if exists
      if (admin.avatar) {
        UploadService.deleteFileByUrl(admin.avatar);
      }

      // Get proper file URL with full path (includes subdirectories)
      const avatarUrl = `/${req.file.path.replace(/\\/g, '/')}`;
      await AdminAuthService.updateProfile(adminId, { avatar: avatarUrl });

      res.json({
        ok: true,
        message: req.t('upload.success'),
        messageKey: 'upload.success',
        data: { avatarUrl }
      });
    } catch (error) {
      // Clean up file on error
      if (req.file) {
        UploadService.cleanupFiles(req.file);
      }
      next(error);
    }
  }

  /**
   * Get all admins
   * GET /api/admins
   */
  async getAllAdmins(req, res, next) {
    try {
      const filters = {
        isActive: req.query.isActive === 'true' ? true : 
                  req.query.isActive === 'false' ? false : undefined,
        search: req.query.search
      };

      const admins = await AdminAuthService.getAllAdmins(filters);

      res.json({
        ok: true,
        message: req.t('auth.adminsRetrieved'),
        messageKey: 'auth.adminsRetrieved',
        data: { admins, count: admins.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get admin by ID
   * GET /api/admins/:id
   */
  async getAdminById(req, res, next) {
    try {
      const adminId = parseInt(req.params.id);
      const admin = await AdminAuthService.getAdminProfile(adminId);

      res.json({
        ok: true,
        message: req.t('auth.adminRetrieved'),
        messageKey: 'auth.adminRetrieved',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update admin
   * PATCH /api/admins/:id
   */
  async updateAdmin(req, res, next) {
    try {
      const adminId = parseInt(req.params.id);
      const updateData = req.body;

      const admin = await AdminAuthService.updateProfile(adminId, updateData);

      res.json({
        ok: true,
        message: req.t('auth.adminUpdated'),
        messageKey: 'auth.adminUpdated',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Activate/Deactivate admin
   * PATCH /api/admins/:id/status
   */
  async setAdminStatus(req, res, next) {
    try {
      const adminId = parseInt(req.params.id);
      const { isActive } = req.body;
      const updatedBy = req.user.id;

      const admin = await AdminAuthService.setAdminStatus(adminId, isActive, updatedBy);

      res.json({
        ok: true,
        message: req.t(isActive ? 'auth.adminActivated' : 'auth.adminDeactivated'),
        messageKey: isActive ? 'auth.adminActivated' : 'auth.adminDeactivated',
        data: { admin }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete admin
   * DELETE /api/admins/:id
   */
  async deleteAdmin(req, res, next) {
    try {
      const adminId = parseInt(req.params.id);
      const deletedBy = req.user.id;

      await AdminAuthService.deleteAdmin(adminId, deletedBy);

      res.json({
        ok: true,
        message: req.t('auth.adminDeleted'),
        messageKey: 'auth.adminDeleted',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign roles to admin
   * POST /api/admins/:id/roles
   */
  async assignRoles(req, res, next) {
    try {
      const adminId = parseInt(req.params.id);
      const { roleIds } = req.body;
      const assignedBy = req.user.id;

      const result = await RBACService.assignRolesToAdmin(adminId, roleIds, assignedBy);

      res.json({
        ok: true,
        message: req.t('rbac.rolesAssigned'),
        messageKey: 'rbac.rolesAssigned',
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Refresh access token
   * POST /api/admins/refresh-token
   */
  async refreshToken(req, res, next) {
    try {
      const { refreshToken } = req.body;

      const tokens = await AdminAuthService.refreshToken(refreshToken);

      res.json({
        ok: true,
        message: req.t('auth.tokenRefreshed'),
        messageKey: 'auth.tokenRefreshed',
        data: { tokens }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
