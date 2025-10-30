const RBACService = require('@services/RBACService');

/**
 * RBAC Controller
 * 
 * Handles role and permission management HTTP requests
 */
class RBACController {
  /**
   * Get all roles
   * GET /api/rbac/roles
   */
  async getRoles(req, res, next) {
    try {
      const activeOnly = req.query.activeOnly === 'true';
      const roles = await RBACService.getAllRoles(activeOnly);

      res.json({
        ok: true,
        message: req.t('rbac.rolesRetrieved'),
        messageKey: 'rbac.rolesRetrieved',
        data: { roles, count: roles.length }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get role by ID with permissions
   * GET /api/rbac/roles/:id
   */
  async getRoleById(req, res, next) {
    try {
      const roleId = parseInt(req.params.id);
      const role = await RBACService.getRoleWithPermissions(roleId);

      res.json({
        ok: true,
        message: req.t('rbac.roleRetrieved'),
        messageKey: 'rbac.roleRetrieved',
        data: { role }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create role
   * POST /api/rbac/roles
   */
  async createRole(req, res, next) {
    try {
      const roleData = req.body;
      const createdBy = req.user.id;

      const role = await RBACService.createRole(roleData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('rbac.roleCreated'),
        messageKey: 'rbac.roleCreated',
        data: { role }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update role
   * PATCH /api/rbac/roles/:id
   */
  async updateRole(req, res, next) {
    try {
      const roleId = parseInt(req.params.id);
      const updateData = req.body;
      const updatedBy = req.user.id;

      const role = await RBACService.updateRole(roleId, updateData, updatedBy);

      res.json({
        ok: true,
        message: req.t('rbac.roleUpdated'),
        messageKey: 'rbac.roleUpdated',
        data: { role }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete role
   * DELETE /api/rbac/roles/:id
   */
  async deleteRole(req, res, next) {
    try {
      const roleId = parseInt(req.params.id);
      const deletedBy = req.user.id;

      await RBACService.deleteRole(roleId, deletedBy);

      res.json({
        ok: true,
        message: req.t('rbac.roleDeleted'),
        messageKey: 'rbac.roleDeleted',
        data: null
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Assign permissions to role
   * POST /api/rbac/roles/:id/permissions
   */
  async assignPermissions(req, res, next) {
    try {
      const roleId = parseInt(req.params.id);
      const { permissionIds } = req.body;
      const grantedBy = req.user.id;

      const role = await RBACService.assignPermissionsToRole(roleId, permissionIds, grantedBy);

      res.json({
        ok: true,
        message: req.t('rbac.permissionsAssigned'),
        messageKey: 'rbac.permissionsAssigned',
        data: { role }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all permissions (grouped)
   * GET /api/rbac/permissions
   */
  async getPermissions(req, res, next) {
    try {
      const groupBy = req.query.groupBy || 'group'; // 'group' or 'resource'
      const permissions = await RBACService.getAllPermissionsGrouped(groupBy);

      res.json({
        ok: true,
        message: req.t('rbac.permissionsRetrieved'),
        messageKey: 'rbac.permissionsRetrieved',
        data: { permissions }
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create permission
   * POST /api/rbac/permissions
   */
  async createPermission(req, res, next) {
    try {
      const permissionData = req.body;
      const createdBy = req.user.id;

      const permission = await RBACService.createPermission(permissionData, createdBy);

      res.status(201).json({
        ok: true,
        message: req.t('rbac.permissionCreated'),
        messageKey: 'rbac.permissionCreated',
        data: { permission }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new RBACController();

