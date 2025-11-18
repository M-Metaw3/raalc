const express = require('express');
const router = express.Router();
const agentController = require('@controllers/agentController');
const { authenticate, authorize } = require('@middleware/auth');
const { validate } = require('@middleware/validation');
const { wrapMulterUpload, logUpload } = require('@middleware/uploadHandler');
const UploadService = require('@services/UploadService');
const {
  registerAgentValidation,
  loginValidation,
  refreshTokenValidation,
  changePasswordValidation,
  approveAgentValidation,
  rejectAgentValidation,
  updateAgentValidation,
  createAgentValidation
} = require('../validators/authValidator');
const { requirePermission } = require('@middleware/rbac');

/**
 * Agent Routes
 * 
 * All routes related to agent operations
 * Agents require admin approval before they can login
 */

// ============================================
// PUBLIC ROUTES
// ============================================

/**
 * @route   GET /api/agents/featured
 * @desc    Get featured agents
 * @access  Public
 */
router.get('/featured', agentController.getFeaturedAgents);

/**
 * @route   POST /api/agents/register
 * @desc    Register a new agent (requires admin approval)
 * @access  Public
 */
router.post(
  '/register',
  registerAgentValidation,
  validate,
  agentController.register
);

/**
 * @route   POST /api/agents/login
 * @desc    Agent login (only if approved)
 * @access  Public
 */
router.post(
  '/login',
  loginValidation,
  validate,
  agentController.login
);

/**
 * @route   POST /api/agents/refresh-token
 * @desc    Refresh agent access token
 * @access  Public
 */
router.post(
  '/refresh-token',
  refreshTokenValidation,
  validate,
  agentController.refreshToken
);

// ============================================
// AUTHENTICATED AGENT ROUTES
// ============================================

/**
 * @route   GET /api/agents/me
 * @desc    Get current agent profile
 * @access  Private - Agent only
 */
router.get(
  '/me',
  authenticate,
  authorize('AGENT'),
  agentController.getProfile
);

/**
 * @route   POST /api/agents/change-password
 * @desc    Change agent password
 * @access  Private - Agent only
 */
router.post(
  '/change-password',
  authenticate,
  authorize('AGENT'),
  changePasswordValidation,
  validate,
  agentController.changePassword
);

/**
 * @route   POST /api/agents/avatar
 * @desc    Upload/Update agent avatar
 * @access  Private - Agent only
 */
router.post(
  '/avatar',
  authenticate,
  authorize('AGENT'),
  wrapMulterUpload(UploadService.createAgentImageUpload()),
  logUpload,
  agentController.uploadAvatar
);

/**
 * @route   DELETE /api/agents/avatar
 * @desc    Delete agent avatar
 * @access  Private - Agent only
 */
router.delete(
  '/avatar',
  authenticate,
  authorize('AGENT'),
  agentController.deleteAvatar
);

// ============================================
// SHIFT MANAGEMENT ROUTES (MVP)
// ============================================
// Mount shift routes BEFORE admin routes to avoid conflicts
const agentShiftRoutes = require('./agentShiftRoutes');
router.use('/', agentShiftRoutes);

// ============================================
// ADMIN ONLY ROUTES
// ============================================

/**
 * @route   GET /api/agents/list
 * @desc    Get all agents with filtering and pagination
 * @access  Private - Admin only
 * @query   isActive (optional) - Filter by active status (true/false)
 * @query   search (optional) - Search by name or email
 * @query   page (optional) - Page number (default: 1)
 * @query   limit (optional) - Items per page (default: 20)
 */
router.get(
  '/list',
  authenticate,
  authorize('ADMIN'),
  agentController.getAllAgents
);

/**
 * @route   GET /api/agents/pending
 * @desc    Get all pending agent applications
 * @access  Private - Admin only
 */
router.get(
  '/pending',
  authenticate,
  authorize('ADMIN'),
  agentController.getPendingAgents
);

/**
 * @route   POST /api/agents/:agentId/approve
 * @desc    Approve and activate an agent account
 * @access  Private - Admin only
 */
router.post(
  '/:agentId/approve',
  authenticate,
  authorize('ADMIN'),
  approveAgentValidation,
  validate,
  agentController.approveAgent
);

/**
 * @route   POST /api/agents/create
 * @desc    Create agent by admin
 * @access  Private - Admin only with agents.create permission
 */
router.post(
  '/create',
  authenticate,
  authorize('ADMIN'),
  requirePermission('agents.create'),
  createAgentValidation,
  validate,
  agentController.createAgent
);

/**
 * @route   POST /api/agents/:agentId/reject
 * @desc    Reject an agent application
 * @access  Private - Admin only
 */
router.post(
  '/:agentId/reject',
  authenticate,
  authorize('ADMIN'),
  rejectAgentValidation,
  validate,
  agentController.rejectAgent
);

/**
 * @route   POST /api/agents/:agentId/deactivate
 * @desc    Deactivate an agent account
 * @access  Private - Admin only
 */
router.post(
  '/:agentId/deactivate',
  authenticate,
  authorize('ADMIN'),
  agentController.deactivateAgent
);

/**
 * @route   POST /api/agents/:agentId/activate
 * @desc    Activate an agent account
 * @access  Private - Admin only
 */
router.post(
  '/:agentId/activate',
  authenticate,
  authorize('ADMIN'),
  agentController.activateAgent
);

// ============================================
// AUTHENTICATED AGENT SELF-UPDATE
// NOTE: These routes MUST come before /:id routes
// to avoid Express treating 'profile' as an :id parameter
// ============================================

/**
 * @route   PUT /api/agents/profile
 * @desc    Update own agent profile
 * @access  Private - Agent only (self)
 */
router.put(
  '/profile',
  authenticate,
  authorize('AGENT'),
  updateAgentValidation,
  validate,
  agentController.updateAgent
);

// ============================================
// ADMIN ROUTES WITH :id PARAMETER
// NOTE: These MUST come after /profile route
// ============================================

/**
 * @route   GET /api/agents/:id
 * @desc    Get agent details with all relations
 * @access  Private - Admin only with agents.read permission
 */
router.get(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('agents.read'),
  agentController.getAgentById
);

/**
 * @route   PUT /api/agents/:id
 * @desc    Update agent details (e.g., assign shift/department)
 * @access  Private - Admin only with agents.update permission
 */
router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  requirePermission('agents.update'),
  updateAgentValidation,
  validate,
  agentController.updateAgent
);

/**
 * @route   PATCH /api/agents/:id/featured
 * @desc    Toggle agent featured status
 * @access  Private - Admin only with agents.feature permission
 */
router.patch(
  '/:id/featured',
  authenticate,
  authorize('ADMIN'),
  requirePermission('agents.feature'),
  agentController.toggleFeatured
);

module.exports = router;

