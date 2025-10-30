const AgentSessionService = require('@services/AgentSessionService');
const BreakRequestService = require('@services/BreakRequestService');
const ActivityLogService = require('@services/ActivityLogService');
const ErrorHandler = require('@utils/ErrorHandler');

/**
 * Agent Shift Controller
 * 
 * Handles agent shift operations:
 * - Check-in/Check-out
 * - Break requests
 * - Session status
 */

/**
 * @route POST /api/agents/check-in
 * @desc Agent check-in (start work)
 * @access Private (Agent only)
 */
exports.checkIn = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { location } = req.body; // Optional GPS location {lat, lng}

    const result = await AgentSessionService.checkIn(agentId, ipAddress, location);

    res.status(200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        session: result.session,
        shift: result.shift,
        status: result.status,
        lateMinutes: result.lateMinutes
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/agents/check-out
 * @desc Agent check-out (end work)
 * @access Private (Agent only)
 */
exports.checkOut = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const { location } = req.body; // Optional GPS location

    const result = await AgentSessionService.checkOut(agentId, ipAddress, location);

    res.status(200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        session: result.session,
        summary: result.summary
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/session/status
 * @desc Get agent's current session status
 * @access Private (Agent only)
 */
exports.getStatus = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const status = await AgentSessionService.getStatus(agentId);

    res.status(200).json({
      ok: true,
      message: 'shift.statusRetrieved',
      data: status
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/agents/break/request
 * @desc Request a break
 * @access Private (Agent only)
 */
exports.requestBreak = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { type, requestedDuration, reason } = req.body;

    const result = await BreakRequestService.requestBreak(agentId, {
      type,
      requestedDuration,
      reason
    });

    res.status(result.requiresApproval ? 202 : 200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        breakRequest: result.breakRequest,
        requiresApproval: result.requiresApproval || false
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/agents/break/end
 * @desc End current break (resume work)
 * @access Private (Agent only)
 */
exports.endBreak = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const result = await BreakRequestService.endBreak(agentId);

    res.status(200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        breakRequest: result.breakRequest,
        actualDuration: result.actualDuration
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/breaks/today
 * @desc Get today's breaks
 * @access Private (Agent only)
 */
exports.getTodayBreaks = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const breaks = await BreakRequestService.getTodayBreaks(agentId);

    res.status(200).json({
      ok: true,
      message: 'shift.breaksRetrieved',
      data: {
        breaks,
        count: breaks.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/session/:sessionId
 * @desc Get session details
 * @access Private (Agent only)
 */
exports.getSessionDetails = async (req, res, next) => {
  try {
    const { sessionId } = req.params;
    const result = await AgentSessionService.getSessionDetails(sessionId);

    // Verify agent owns this session
    if (result.session.agentId !== req.user.id) {
      throw ErrorHandler.forbidden('shift.notYourSession');
    }

    res.status(200).json({
      ok: true,
      message: 'shift.sessionRetrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/sessions/history
 * @desc Get agent's session history
 * @access Private (Agent only)
 */
exports.getHistory = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { startDate, endDate } = req.query;

    // Default to last 30 days if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const result = await AgentSessionService.getHistory(agentId, start, end);

    res.status(200).json({
      ok: true,
      message: 'shift.historyRetrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/activity-logs
 * @desc Get agent's activity logs
 * @access Private (Agent only)
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { limit } = req.query;

    const result = await ActivityLogService.getAgentLogs(
      agentId,
      limit ? parseInt(limit) : 50
    );

    res.status(200).json({
      ok: true,
      message: 'shift.activityLogsRetrieved',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/agents/activity-stats
 * @desc Get agent's activity statistics
 * @access Private (Agent only)
 */
exports.getActivityStats = async (req, res, next) => {
  try {
    const agentId = req.user.id;
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const stats = await ActivityLogService.getActivityStats(agentId, start, end);

    res.status(200).json({
      ok: true,
      message: 'shift.statsRetrieved',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

