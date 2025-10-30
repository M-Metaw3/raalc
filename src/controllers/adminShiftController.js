const BreakRequestService = require('@services/BreakRequestService');
const AgentSessionRepository = require('@repositories/AgentSessionRepository');
const ShiftRepository = require('@repositories/ShiftRepository');
const DepartmentRepository = require('@repositories/DepartmentRepository');
const ActivityLogService = require('@services/ActivityLogService');

/**
 * Admin Shift Controller
 * 
 * Handles admin operations for shift management:
 * - Approve/Reject break requests
 * - View sessions and reports
 * - Manage shifts and policies
 */

/**
 * @route GET /api/admin/break-requests/pending
 * @desc Get pending break requests
 * @access Private (Admin with permission)
 */
exports.getPendingBreakRequests = async (req, res, next) => {
  try {
    const { departmentId, agentId } = req.query;

    const filters = {};
    if (departmentId) filters.departmentId = parseInt(departmentId);
    if (agentId) filters.agentId = parseInt(agentId);

    const requests = await BreakRequestService.getPendingRequests(filters);

    res.status(200).json({
      ok: true,
      message: 'shift.pendingRequestsRetrieved',
      data: {
        requests,
        count: requests.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/admin/break-requests/:id/approve
 * @desc Approve break request
 * @access Private (Admin with permission)
 */
exports.approveBreakRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const adminId = req.user.id;

    const result = await BreakRequestService.approveBreakRequest(
      parseInt(id),
      adminId,
      notes
    );

    res.status(200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        breakRequest: result.breakRequest
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route POST /api/admin/break-requests/:id/reject
 * @desc Reject break request
 * @access Private (Admin with permission)
 */
exports.rejectBreakRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({
        ok: false,
        message: req.t('shift.rejectionReasonRequired'),
        messageKey: 'shift.rejectionReasonRequired'
      });
    }

    const result = await BreakRequestService.rejectBreakRequest(
      parseInt(id),
      adminId,
      reason
    );

    res.status(200).json({
      ok: true,
      message: req.t(result.message),
      messageKey: result.message,
      data: {
        breakRequest: result.breakRequest
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/sessions
 * @desc Get sessions with filters
 * @access Private (Admin with permission)
 */
exports.getSessions = async (req, res, next) => {
  try {
    const { startDate, endDate, agentId, departmentId, status, page = 1, limit = 20 } = req.query;

    // Default to today if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || end;

    const filters = {};
    if (agentId) filters.agentId = parseInt(agentId);
    if (departmentId) filters.departmentId = parseInt(departmentId);
    if (status) filters.status = status;

    const sessions = await AgentSessionRepository.findByDateRange(start, end, filters);

    // Simple pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedSessions = sessions.slice(startIndex, endIndex);

    res.status(200).json({
      ok: true,
      message: 'shift.sessionsRetrieved',
      data: {
        sessions: paginatedSessions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: sessions.length,
          totalPages: Math.ceil(sessions.length / limitNum)
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/sessions/:id
 * @desc Get session details (for any agent)
 * @access Private (Admin with permission)
 */
exports.getSessionDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const AgentSessionService = require('@services/AgentSessionService');
    
    const result = await AgentSessionService.getSessionDetails(parseInt(id));

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
 * @route GET /api/admin/dashboard/stats
 * @desc Get dashboard statistics
 * @access Private (Admin with permission)
 */
exports.getDashboardStats = async (req, res, next) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get today's sessions
    const todaySessions = await AgentSessionRepository.findByDateRange(today, today);

    // Get pending break requests
    const pendingBreaks = await BreakRequestService.getPendingRequests();

    // Calculate stats
    const stats = {
      today: {
        totalAgents: todaySessions.length,
        activeAgents: todaySessions.filter(s => s.status === 'active').length,
        onBreak: todaySessions.filter(s => s.status === 'on_break').length,
        completed: todaySessions.filter(s => s.status === 'completed').length,
        lateCheckIns: todaySessions.filter(s => s.checkInStatus === 'late').length
      },
      pendingApprovals: pendingBreaks.length,
      totalWorkMinutes: todaySessions.reduce((sum, s) => sum + (s.totalWorkMinutes || 0), 0),
      totalBreakMinutes: todaySessions.reduce((sum, s) => sum + (s.totalBreakMinutes || 0), 0)
    };

    res.status(200).json({
      ok: true,
      message: 'shift.statsRetrieved',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/shifts
 * @desc Get all shifts
 * @access Private (Admin)
 */
exports.getShifts = async (req, res, next) => {
  try {
    const shifts = await ShiftRepository.findAll();

    res.status(200).json({
      ok: true,
      message: 'shift.shiftsRetrieved',
      data: {
        shifts,
        count: shifts.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/departments
 * @desc Get all departments
 * @access Private (Admin)
 */
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await DepartmentRepository.findAll();

    res.status(200).json({
      ok: true,
      message: 'shift.departmentsRetrieved',
      data: {
        departments,
        count: departments.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route GET /api/admin/activity-logs
 * @desc Get activity logs with filters
 * @access Private (Admin with view_reports permission)
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const { startDate, endDate, agentId, type } = req.query;

    // Default to today if not provided
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || end;

    const filters = {};
    if (agentId) filters.agentId = parseInt(agentId);
    if (type) filters.type = type;

    const result = await ActivityLogService.getLogsByDateRange(start, end, filters);

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
 * @route GET /api/admin/activity-logs/recent
 * @desc Get recent activity across all agents
 * @access Private (Admin with view_reports permission)
 */
exports.getRecentActivity = async (req, res, next) => {
  try {
    const { limit, departmentId } = req.query;

    const filters = {};
    if (departmentId) filters.departmentId = parseInt(departmentId);

    const result = await ActivityLogService.getRecentActivity(
      limit ? parseInt(limit) : 20,
      filters
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
 * @route GET /api/admin/agents/:agentId/activity-logs
 * @desc Get specific agent's activity logs
 * @access Private (Admin with view_reports permission)
 */
exports.getAgentActivityLogs = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { limit } = req.query;

    const result = await ActivityLogService.getAgentLogs(
      parseInt(agentId),
      limit ? parseInt(limit) : 100
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
 * @route GET /api/admin/agents/:agentId/activity-stats
 * @desc Get specific agent's activity statistics
 * @access Private (Admin with view_reports permission)
 */
exports.getAgentActivityStats = async (req, res, next) => {
  try {
    const { agentId } = req.params;
    const { startDate, endDate } = req.query;

    // Default to last 30 days
    const end = endDate || new Date().toISOString().split('T')[0];
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const stats = await ActivityLogService.getActivityStats(
      parseInt(agentId),
      start,
      end
    );

    res.status(200).json({
      ok: true,
      message: 'shift.statsRetrieved',
      data: stats
    });
  } catch (error) {
    next(error);
  }
};

