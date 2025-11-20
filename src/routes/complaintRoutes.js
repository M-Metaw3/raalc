const express = require('express');
const router = express.Router();
const complaintController = require('@controllers/complaintController');
const { authenticate, authorize, optionalAuth } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');
const { validate } = require('@middleware/validation');
const { wrapMulterUpload, logUpload } = require('@middleware/uploadHandler');
const UploadService = require('@services/UploadService');
const {
  createComplaintValidation,
  resolveComplaintValidation,
  rejectComplaintValidation,
  updateStatusValidation,
  complaintIdValidation,
  listComplaintsValidation
} = require('@validators/complaintValidator');

/**
 * Complaint Routes
 * 
 * Routes for managing user complaints
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   POST /api/complaints
 * @desc    Create a new complaint (can be anonymous or authenticated)
 * @access  Public (or Private if authenticated)
 */
router.post(
  '/',
  optionalAuth, // Optional - if user is logged in, we'll use their ID
  wrapMulterUpload(UploadService.uploadComplaintAttachments('attachments', 5)),
  logUpload,
  ...createComplaintValidation,
  complaintController.createComplaint
);

// ============================================
// AUTHENTICATED USER ROUTES
// ============================================

/**
 * @route   GET /api/complaints/my-complaints
 * @desc    Get current user's complaints
 * @access  Private - User only
 */
router.get(
  '/my-complaints',
  authenticate,
  authorize('USER'),
  ...listComplaintsValidation,
  complaintController.getMyComplaints
);

/**
 * @route   GET /api/complaints/:id
 * @desc    Get complaint by ID (own complaints for users, all for admins)
 * @access  Private - User (own) or Admin with complaints.read
 */
const checkAdminPermission = (req, res, next) => {
  if (req.user.userType === 'ADMIN') {
    return requirePermission('complaints.read')(req, res, next);
  }
  next();
};

router.get(
  '/:id',
  authenticate,
  authorize('USER', 'ADMIN'),
  checkAdminPermission,
  ...complaintIdValidation,
  complaintController.getComplaintById
);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route   GET /api/complaints
 * @desc    Get all complaints with filters and pagination
 * @access  Private - Admin only with complaints.list permission
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.list'),
  ...listComplaintsValidation,
  complaintController.getAllComplaints
);

/**
 * @route   GET /api/complaints/statistics
 * @desc    Get complaint statistics
 * @access  Private - Admin only with complaints.list permission
 */
router.get(
  '/statistics',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.list'),
  complaintController.getStatistics
);

/**
 * @route   POST /api/complaints/:id/resolve
 * @desc    Resolve a complaint
 * @access  Private - Admin only with complaints.resolve permission
 */
router.post(
  '/:id/resolve',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.resolve'),
  ...resolveComplaintValidation,
  complaintController.resolveComplaint
);

/**
 * @route   POST /api/complaints/:id/reject
 * @desc    Reject a complaint
 * @access  Private - Admin only with complaints.reject permission
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.reject'),
  ...rejectComplaintValidation,
  complaintController.rejectComplaint
);

/**
 * @route   POST /api/complaints/:id/reopen
 * @desc    Reopen a closed/rejected complaint
 * @access  Private - Admin only with complaints.reopen permission
 */
router.post(
  '/:id/reopen',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.reopen'),
  ...complaintIdValidation,
  complaintController.reopenComplaint
);

/**
 * @route   PATCH /api/complaints/:id/status
 * @desc    Update complaint status
 * @access  Private - Admin only with complaints.update permission
 */
router.patch(
  '/:id/status',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.update'),
  ...updateStatusValidation,
  complaintController.updateStatus
);

/**
 * @route   DELETE /api/complaints/:id
 * @desc    Delete a complaint (soft delete)
 * @access  Private - Admin only with complaints.delete permission
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('complaints.delete'),
  ...complaintIdValidation,
  complaintController.deleteComplaint
);

module.exports = router;

