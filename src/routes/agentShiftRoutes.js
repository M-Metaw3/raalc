const express = require('express');
const router = express.Router();
const agentShiftController = require('@controllers/agentShiftController');
const shiftValidators = require('@validators/shiftValidators');
const { authenticate, authorize } = require('@middleware/auth');

/**
 * Agent Shift Management Routes
 * 
 * All routes require agent authentication
 * Base path: /api/agents
 */

// Check-in/Check-out
router.post(
  '/check-in',
  authenticate,
  authorize('AGENT'),
  shiftValidators.checkInValidation,
  agentShiftController.checkIn
);

router.post(
  '/check-out',
  authenticate,
  authorize('AGENT'),
  shiftValidators.checkOutValidation,
  agentShiftController.checkOut
);

// Session status
router.get(
  '/session/status',
  authenticate,
  authorize('AGENT'),
  agentShiftController.getStatus
);

router.get(
  '/session/:sessionId',
  authenticate,
  authorize('AGENT'),
  shiftValidators.sessionIdValidation,
  agentShiftController.getSessionDetails
);

router.get(
  '/sessions/history',
  authenticate,
  authorize('AGENT'),
  shiftValidators.dateRangeValidation,
  agentShiftController.getHistory
);

// Break management
router.post(
  '/break/request',
  authenticate,
  authorize('AGENT'),
  shiftValidators.breakRequestValidation,
  agentShiftController.requestBreak
);

router.post(
  '/break/end',
  authenticate,
  authorize('AGENT'),
  agentShiftController.endBreak
);

router.get(
  '/breaks/today',
  authenticate,
  authorize('AGENT'),
  agentShiftController.getTodayBreaks
);

// Activity logs
router.get(
  '/activity-logs',
  authenticate,
  authorize('AGENT'),
  agentShiftController.getActivityLogs
);

router.get(
  '/activity-stats',
  authenticate,
  authorize('AGENT'),
  shiftValidators.dateRangeValidation,
  agentShiftController.getActivityStats
);

module.exports = router;

