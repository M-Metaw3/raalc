const express = require('express');
const router = express.Router();
const adminShiftController = require('@controllers/adminShiftController');
const shiftValidators = require('@validators/shiftValidators');
const { authenticate } = require('@middleware/auth');
const { requirePermission } = require('@middleware/rbac');

/**
 * Admin Shift Management Routes
 * 
 * All routes require admin authentication and specific permissions
 * Base path: /api/admin
 */

// Apply authentication to all routes
router.use(authenticate);

// Dashboard stats
router.get(
  '/dashboard/stats',
  requirePermission('view_reports'),
  adminShiftController.getDashboardStats
);

// Break request approvals
router.get(
  '/break-requests/pending',
  requirePermission('manage_breaks'),
  shiftValidators.pendingRequestsFiltersValidation,
  adminShiftController.getPendingBreakRequests
);

router.post(
  '/break-requests/:id/approve',
  requirePermission('manage_breaks'),
  shiftValidators.breakApprovalValidation,
  adminShiftController.approveBreakRequest
);

router.post(
  '/break-requests/:id/reject',
  requirePermission('manage_breaks'),
  shiftValidators.breakRejectionValidation,
  adminShiftController.rejectBreakRequest
);

// Sessions management
router.get(
  '/sessions',
  requirePermission('view_sessions'),
  shiftValidators.sessionFiltersValidation,
  adminShiftController.getSessions
);

router.get(
  '/sessions/:id',
  requirePermission('view_sessions'),
  adminShiftController.getSessionDetails
);

// Shifts and departments (read-only for MVP)
router.get(
  '/shifts',
  requirePermission('view_shifts'),
  adminShiftController.getShifts
);

router.get(
  '/departments',
  requirePermission('view_departments'),
  adminShiftController.getDepartments
);

// Activity logs
router.get(
  '/activity-logs',
  requirePermission('view_reports'),
  adminShiftController.getActivityLogs
);

router.get(
  '/activity-logs/recent',
  requirePermission('view_reports'),
  adminShiftController.getRecentActivity
);

router.get(
  '/agents/:agentId/activity-logs',
  requirePermission('view_reports'),
  adminShiftController.getAgentActivityLogs
);

router.get(
  '/agents/:agentId/activity-stats',
  requirePermission('view_reports'),
  adminShiftController.getAgentActivityStats
);

module.exports = router;

