const express = require('express');
const router = express.Router();
const serviceRequestController = require('@controllers/serviceRequestController');
const { authenticate, authorize } = require('@middleware/auth');
const { uploadDocuments } = require('@middleware/serviceRequestUpload');
const {
  createRequestValidation,
  assignAgentValidation,
  reassignAgentValidation,
  approveRequestValidation,
  rejectRequestValidation,
  completeRequestValidation,
  cancelRequestValidation,
  updatePriorityValidation,
  addAdminNotesValidation,
  getRequestValidation,
  listRequestsValidation
} = require('@validators/serviceRequestValidator');

/**
 * Service Request Routes
 */

// ==================== USER ROUTES ====================

/**
 * @route   POST /api/service-requests
 * @desc    Create a new service request
 * @access  Private (User)
 */
router.post(
  '/',
  authenticate,
  authorize('USER'),
  uploadDocuments,
  ...createRequestValidation,
  serviceRequestController.createRequest
);

/**
 * @route   GET /api/service-requests/my-requests
 * @desc    Get current user's service requests
 * @access  Private (User)
 */
router.get(
  '/my-requests',
  authenticate,
  authorize('USER'),
  ...listRequestsValidation,
  serviceRequestController.getMyRequests
);

/**
 * @route   GET /api/service-requests/:id
 * @desc    Get service request by ID
 * @access  Private (User/Agent/Admin)
 */
router.get(
  '/:id',
  authenticate,
  ...getRequestValidation,
  serviceRequestController.getRequest
);

// ==================== AGENT ROUTES ====================

/**
 * @route   GET /api/service-requests/agent/my-requests
 * @desc    Get agent's assigned service requests
 * @access  Private (Agent)
 */
router.get(
  '/agent/my-requests',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...listRequestsValidation,
  serviceRequestController.getAgentRequests
);

/**
 * @route   GET /api/service-requests/agent/upcoming-meetings
 * @desc    Get agent's upcoming meetings
 * @access  Private (Agent)
 */
router.get(
  '/agent/upcoming-meetings',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  serviceRequestController.getUpcomingMeetings
);

/**
 * @route   PUT /api/service-requests/:id/reassign-agent
 * @desc    Reassign request to another agent
 * @access  Private (Agent/Admin)
 */
router.put(
  '/:id/reassign-agent',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...reassignAgentValidation,
  serviceRequestController.reassignAgent
);

/**
 * @route   PUT /api/service-requests/:id/approve
 * @desc    Approve service request
 * @access  Private (Agent/Admin)
 */
router.put(
  '/:id/approve',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...approveRequestValidation,
  serviceRequestController.approveRequest
);

/**
 * @route   PUT /api/service-requests/:id/reject
 * @desc    Reject service request
 * @access  Private (Agent/Admin)
 */
router.put(
  '/:id/reject',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...rejectRequestValidation,
  serviceRequestController.rejectRequest
);

/**
 * @route   PUT /api/service-requests/:id/complete
 * @desc    Mark service request as completed
 * @access  Private (Agent/Admin)
 */
router.put(
  '/:id/complete',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...completeRequestValidation,
  serviceRequestController.completeRequest
);

/**
 * @route   PUT /api/service-requests/:id/notes
 * @desc    Add admin/agent notes to request
 * @access  Private (Agent/Admin)
 */
router.put(
  '/:id/notes',
  authenticate,
  authorize('AGENT', 'ADMIN'),
  ...addAdminNotesValidation,
  serviceRequestController.addAdminNotes
);

// ==================== ADMIN ROUTES ====================

/**
 * @route   GET /api/service-requests/admin/all
 * @desc    Get all service requests (with filters)
 * @access  Private (Admin)
 */
router.get(
  '/admin/all',
  authenticate,
  authorize('ADMIN'),
  ...listRequestsValidation,
  serviceRequestController.getAllRequests
);

/**
 * @route   GET /api/service-requests/admin/statistics
 * @desc    Get service requests statistics
 * @access  Private (Admin)
 */
router.get(
  '/admin/statistics',
  authenticate,
  authorize('ADMIN'),
  serviceRequestController.getStatistics
);

/**
 * @route   PUT /api/service-requests/:id/assign-agent
 * @desc    Assign agent to service request
 * @access  Private (Admin)
 */
router.put(
  '/:id/assign-agent',
  authenticate,
  authorize('ADMIN'),
  ...assignAgentValidation,
  serviceRequestController.assignAgent
);

/**
 * @route   PUT /api/service-requests/:id/cancel
 * @desc    Cancel service request
 * @access  Private (Admin)
 */
router.put(
  '/:id/cancel',
  authenticate,
  authorize('ADMIN'),
  ...cancelRequestValidation,
  serviceRequestController.cancelRequest
);

/**
 * @route   PUT /api/service-requests/:id/priority
 * @desc    Update service request priority
 * @access  Private (Admin)
 */
router.put(
  '/:id/priority',
  authenticate,
  authorize('ADMIN'),
  ...updatePriorityValidation,
  serviceRequestController.updatePriority
);

module.exports = router;

