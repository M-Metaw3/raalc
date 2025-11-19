const express = require('express');
const router = express.Router();
const userController = require('@controllers/userController');
const { authenticate, authorize } = require('@middleware/auth');
const { validate } = require('@middleware/validation');
const { requirePermission } = require('@middleware/rbac');
const { wrapMulterUpload, logUpload } = require('@middleware/uploadHandler');
const UploadService = require('@services/UploadService');
const {
  registerUserValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation
} = require('../validators/authValidator');

const {
  verifyOTP,
  resendOTP,
  verifyLoginOTP,
  forgotPassword,
  resetPassword
} = require('../validators/otpValidators');

const {
  uploadDocuments,
  deleteDocument
} = require('../validators/documentValidator');

const otpRateLimiter = require('@middleware/otpRateLimiter');

/**
 * User Routes
 * 
 * All routes related to regular user operations
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   POST /api/users/register
 * @desc    Register a new user (auto-activated)
 * @access  Public
 */
router.post(
  '/register',
  ...registerUserValidation,
  userController.register
);

/**
 * @route   POST /api/users/login
 * @desc    User login
 * @access  Public
 */
router.post(
  '/login',
  ...loginValidation,
  userController.login
);

/**
 * @route   POST /api/users/refresh-token
 * @desc    Refresh user access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  ...refreshTokenValidation,
  userController.refreshToken
);

/**
 * @route   POST /api/users/verify-otp
 * @desc    Verify OTP after registration
 * @access  Public
 */
router.post(
  '/verify-otp',
  otpRateLimiter.limitVerifyOTP(),
  ...verifyOTP,
  userController.verifyOTP
);

/**
 * @route   POST /api/users/resend-otp
 * @desc    Resend OTP
 * @access  Public
 */
router.post(
  '/resend-otp',
  otpRateLimiter.limitSendOTP(),
  ...resendOTP,
  userController.resendOTP
);

/**
 * @route   POST /api/users/verify-login-otp
 * @desc    Verify OTP for login (new device)
 * @access  Public
 */
router.post(
  '/verify-login-otp',
  otpRateLimiter.limitVerifyOTP(),
  ...verifyLoginOTP,
  userController.verifyLoginOTP
);

/**
 * @route   POST /api/users/forgot-password
 * @desc    Request password reset (sends OTP)
 * @access  Public
 */
router.post(
  '/forgot-password',
  otpRateLimiter.limitForgotPassword(),
  ...forgotPassword,
  userController.forgotPassword
);

/**
 * @route   POST /api/users/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  '/reset-password',
  otpRateLimiter.limitVerifyOTP(),
  ...resetPassword,
  userController.resetPassword
);

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

/**
 * @route   GET /api/users/me
 * @desc    Get current user profile
 * @access  Private - User only
 */
router.get(
  '/me',
  authenticate,
  authorize('USER'),
  userController.getProfile
);

/**
 * @route   POST /api/users/change-password
 * @desc    Change user password
 * @access  Private - User only
 */
router.post(
  '/change-password',
  authenticate,
  authorize('USER'),
  ...changePasswordValidation,
  userController.changePassword
);

/**
 * @route   PATCH /api/users/avatar
 * @desc    Upload/Update user avatar
 * @access  Private - User only
 */
router.patch(
  '/avatar',
  authenticate,
  authorize('USER'),
  wrapMulterUpload(UploadService.createUserImageUpload()),
  logUpload,
  userController.uploadAvatar
);

/**
 * @route   DELETE /api/users/avatar
 * @desc    Delete user avatar
 * @access  Private - User only
 */
router.delete(
  '/avatar',
  authenticate,
  authorize('USER'),
  userController.deleteAvatar
);

// ============================================
// DOCUMENT MANAGEMENT ROUTES
// ============================================

/**
 * @route   POST /api/users/documents
 * @desc    Upload user documents
 * @access  Private - User only
 */
router.post(
  '/documents',
  authenticate,
  authorize('USER'),
  wrapMulterUpload(UploadService.uploadMultiple('USER', 'documents')),
  logUpload,
  ...uploadDocuments,
  userController.uploadDocuments
);

/**
 * @route   GET /api/users/documents
 * @desc    Get user documents
 * @access  Private - User only
 */
router.get(
  '/documents',
  authenticate,
  authorize('USER'),
  userController.getDocuments
);

/**
 * @route   DELETE /api/users/documents/:documentId
 * @desc    Delete a user document
 * @access  Private - User only
 */
router.delete(
  '/documents/:documentId',
  authenticate,
  authorize('USER'),
  ...deleteDocument,
  userController.deleteDocument
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route   GET /api/users/list
 * @desc    Get all users with filtering and pagination
 * @access  Private - Admin only with users.list permission
 * @query   isActive (optional) - Filter by active status (true/false)
 * @query   search (optional) - Search by name or email
 * @query   page (optional) - Page number (default: 1)
 * @query   limit (optional) - Items per page (default: 20)
 */
router.get(
  '/list',
  authenticate,
  authorize('ADMIN'),
  requirePermission('users.list'),
  userController.getAllUsers
);

/**
 * @route   POST /api/users/:userId/deactivate
 * @desc    Deactivate a user account
 * @access  Private - Admin only with users.deactivate permission
 */
router.post(
  '/:userId/deactivate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('users.deactivate'),
  userController.deactivateUser
);

/**
 * @route   POST /api/users/:userId/activate
 * @desc    Activate a user account
 * @access  Private - Admin only with users.activate permission
 */
router.post(
  '/:userId/activate',
  authenticate,
  authorize('ADMIN'),
  requirePermission('users.activate'),
  userController.activateUser
);

module.exports = router;

