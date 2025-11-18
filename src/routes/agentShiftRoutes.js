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

// Apply authentication and authorization to all routes
router.use(authenticate);
router.use(authorize('AGENT'));

// Check-in/Check-out
router.post(
  '/check-in',
  shiftValidators.checkInValidation,
  agentShiftController.checkIn
);

router.post(
  '/check-out',
  shiftValidators.checkOutValidation,
  agentShiftController.checkOut
);

// Session status
router.get(
  '/session/status',
  agentShiftController.getStatus
);

router.get(
  '/session/:sessionId',
  shiftValidators.sessionIdValidation,
  agentShiftController.getSessionDetails
);

router.get(
  '/sessions/history',
  shiftValidators.dateRangeValidation,
  agentShiftController.getHistory
);

// Break management
router.post(
  '/break/request',
  shiftValidators.breakRequestValidation,
  agentShiftController.requestBreak
);

router.post(
  '/break/end',
  agentShiftController.endBreak
);

router.get(
  '/breaks/today',
  agentShiftController.getTodayBreaks
);

// Activity logs
router.get(
  '/activity-logs',
  agentShiftController.getActivityLogs
);

router.get(
  '/activity-stats',
  shiftValidators.dateRangeValidation,
  agentShiftController.getActivityStats
);

module.exports = router;

