const express = require('express');
const router = express.Router();
const rbacController = require('@controllers/rbacController');
const { authenticate, authorize } = require('@middleware/auth');
const { 
  requirePermission,
  canManagePermissions,
  canManageRoles 
} = require('@middleware/rbac');
const {
  createRoleValidation,
  updateRoleValidation,
  roleIdValidation,
  assignPermissionsValidation,
  createPermissionValidation,
  permissionsQueryValidation,
  removePermissionValidation
} = require('@validators/rbacValidator');

/**
 * RBAC Routes
 * 
 * Role and Permission management routes
 * All routes require admin authentication
 */

// ============================================
// ROLE ROUTES
// ============================================

/**
 * @route   GET /api/rbac/roles
 * @desc    Get all roles
 * @access  Private - Requires 'roles.list' permission
 */
router.get(
  '/roles',
  authenticate,
  authorize('ADMIN'),
  requirePermission('roles.list'),
  rbacController.getRoles
);

/**
 * @route   GET /api/rbac/roles/:id
 * @desc    Get role by ID with permissions
 * @access  Private - Requires 'roles.read' permission
 */
router.get(
  '/roles/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('roles.read'),
  ...roleIdValidation,
  rbacController.getRoleById
);

/**
 * @route   POST /api/rbac/roles
 * @desc    Create new role
 * @access  Private - Super Admin or Admin with 'roles.create' permission
 */
router.post(
  '/roles',
  authenticate,
  authorize('ADMIN'),
  canManageRoles(),
  requirePermission('roles.create'),
  ...createRoleValidation,
  rbacController.createRole
);

/**
 * @route   PATCH /api/rbac/roles/:id
 * @desc    Update role
 * @access  Private - Super Admin or Admin with 'roles.update' permission
 */
router.patch(
  '/roles/:id',
  authenticate,
  authorize('ADMIN'),
  canManageRoles(),
  requirePermission('roles.update'),
  ...updateRoleValidation,
  rbacController.updateRole
);

/**
 * @route   DELETE /api/rbac/roles/:id
 * @desc    Delete role
 * @access  Private - Super Admin or Admin with 'roles.delete' permission
 */
router.delete(
  '/roles/:id',
  authenticate,
  authorize('ADMIN'),
  canManageRoles(),
  requirePermission('roles.delete'),
  ...roleIdValidation,
  rbacController.deleteRole
);

/**
 * @route   POST /api/rbac/roles/:id/permissions
 * @desc    Assign permissions to role
 * @access  Private - Super Admin or Admin with 'permissions.grant' permission
 */
router.post(
  '/roles/:id/permissions',
  authenticate,
  authorize('ADMIN'),
  canManagePermissions(),
  ...assignPermissionsValidation,
  rbacController.assignPermissions
);

/**
 * @route   GET /api/rbac/roles/:id/permissions
 * @desc    Get role permissions
 * @access  Private - Requires 'permissions.list' permission
 */
router.get(
  '/roles/:id/permissions',
  authenticate,
  authorize('ADMIN'),
  requirePermission('permissions.list'),
  ...roleIdValidation,
  rbacController.getRolePermissions
);

/**
 * @route   DELETE /api/rbac/roles/:roleId/permissions/:permissionId
 * @desc    Remove a specific permission from role
 * @access  Private - Super Admin or Admin with 'permissions.revoke' permission
 */
router.delete(
  '/roles/:roleId/permissions/:permissionId',
  authenticate,
  authorize('ADMIN'),
  canManagePermissions(),
  requirePermission('permissions.revoke'),
  ...removePermissionValidation,
  rbacController.removePermission
);

// ============================================
// PERMISSION ROUTES
// ============================================

/**
 * @route   GET /api/rbac/permissions
 * @desc    Get all permissions (grouped)
 * @access  Private - Requires 'permissions.list' permission
 */
router.get(
  '/permissions',
  authenticate,
  authorize('ADMIN'),
  requirePermission('permissions.list'),
  ...permissionsQueryValidation,
  rbacController.getPermissions
);

/**
 * @route   POST /api/rbac/permissions
 * @desc    Create new permission
 * @access  Private - Super Admin or Admin with 'permissions.create' permission
 */
router.post(
  '/permissions',
  authenticate,
  authorize('ADMIN'),
  canManagePermissions(),
  requirePermission('permissions.create'),
  ...createPermissionValidation,
  rbacController.createPermission
);

module.exports = router;

