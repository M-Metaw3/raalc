const express = require('express');
const router = express.Router();
const adminController = require('@controllers/adminController');
const { authenticate, authorize } = require('@middleware/auth');
const { 
  requirePermission, 
  requireRole,
  requireSuperAdmin,
  canManageRoles 
} = require('@middleware/rbac');
const {
  loginValidation,
  createAdminValidation,
  updateProfileValidation,
  changePasswordValidation,
  adminIdValidation,
  setStatusValidation,
  assignRolesValidation,
  refreshTokenValidation,
  queryFiltersValidation
} = require('@validators/adminValidator');
const UploadService = require('@services/UploadService');
const { wrapMulterUpload, logUpload } = require('@middleware/upload');

/**
 * Admin Routes
 * 
 * All routes require admin authentication
 * Uses RBAC middleware for permission checking
 */

// ============================================
// PUBLIC ROUTES (No authentication)
// ============================================

/**
 * @route   POST /api/admins/login
 * @desc    Admin login (email + password, no OTP)
 * @access  Public
 */
router.post('/login', ...loginValidation, adminController.login);

/**
 * @route   POST /api/admins/refresh-token
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh-token', ...refreshTokenValidation, adminController.refreshToken);

// ============================================
// PROTECTED ROUTES (Require authentication)
// ============================================

/**
 * @route   GET /api/admins/profile
 * @desc    Get current admin profile
 * @access  Private - Admin only
 */
router.get(
  '/profile',
  authenticate,
  authorize('ADMIN'),
  adminController.getProfile
);

/**
 * @route   PATCH /api/admins/profile
 * @desc    Update current admin profile
 * @access  Private - Admin only
 */
router.patch(
  '/profile',
  authenticate,
  authorize('ADMIN'),
  ...updateProfileValidation,
  adminController.updateProfile
);

/**
 * @route   POST /api/admins/change-password
 * @desc    Change current admin password
 * @access  Private - Admin only
 */
router.post(
  '/change-password',
  authenticate,
  authorize('ADMIN'),
  ...changePasswordValidation,
  adminController.changePassword
);

/**
 * @route   POST /api/admins/avatar
 * @desc    Upload admin avatar
 * @access  Private - Admin only
 */
router.post(
  '/avatar',
  authenticate,
  authorize('ADMIN'),
  wrapMulterUpload(UploadService.uploadSingle('ADMIN', 'avatar')),
  logUpload,
  adminController.uploadAvatar
);

// ============================================
// ADMIN MANAGEMENT ROUTES (Require permissions)
// ============================================

/**
 * @route   GET /api/admins
 * @desc    Get all admins
 * @access  Private - Requires 'admins.list' permission
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('admins.list'),
  ...queryFiltersValidation,
  adminController.getAllAdmins
);

/**
 * @route   POST /api/admins
 * @desc    Create new admin
 * @access  Private - Requires 'admins.create' permission
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('admins.create'),
  ...createAdminValidation,
  adminController.createAdmin
);

// ============================================
// SHIFT MANAGEMENT ROUTES (MVP)
// ============================================
// IMPORTANT: These must come BEFORE /:id routes to avoid conflicts

// Import admin shift routes
const adminShiftRoutes = require('./adminShiftRoutes');

// Mount shift management routes
router.use('/', adminShiftRoutes);

// ============================================
// ADMIN ID-BASED ROUTES (Must come AFTER specific routes)
// ============================================

/**
 * @route   GET /api/admins/:id
 * @desc    Get admin by ID
 * @access  Private - Requires 'admins.read' permission
 */
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('admins.read'),
  ...adminIdValidation,
  adminController.getAdminById
);

/**
 * @route   PATCH /api/admins/:id
 * @desc    Update admin
 * @access  Private - Requires 'admins.update' permission
 */
router.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('admins.update'),
  ...adminIdValidation,
  ...updateProfileValidation,
  adminController.updateAdmin
);

/**
 * @route   PATCH /api/admins/:id/status
 * @desc    Activate/Deactivate admin
 * @access  Private - Requires 'admins.activate' or 'admins.deactivate' permission
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  requirePermission(['admins.activate', 'admins.deactivate']),
  ...setStatusValidation,
  adminController.setAdminStatus
);

/**
 * @route   DELETE /api/admins/:id
 * @desc    Delete admin (soft delete)
 * @access  Private - Requires 'admins.delete' permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('admins.delete'),
  ...adminIdValidation,
  adminController.deleteAdmin
);

/**
 * @route   POST /api/admins/:id/roles
 * @desc    Assign roles to admin
 * @access  Private - Super Admin or Admin with 'roles.assign' permission
 */
router.post(
  '/:id/roles',
  authenticate,
  authorize('ADMIN'),
  canManageRoles(),
  ...assignRolesValidation,
  adminController.assignRoles
);

module.exports = router;
