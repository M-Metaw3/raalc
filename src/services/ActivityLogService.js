const ActivityLogRepository = require('@repositories/ActivityLogRepository');
const AgentRepository = require('@repositories/AgentRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');

/**
 * ActivityLog Service
 * 
 * Service for managing activity logs and audit trails
 */
class ActivityLogService {
  /**
   * Get agent's own activity logs
   */
  async getAgentLogs(agentId, limit = 50) {
    const agent = await AgentRepository.findById(agentId);
    if (!agent) {
      throw ErrorHandlers.notFound('shift.agentNotFound');
    }

    const logs = await ActivityLogRepository.findByAgent(agentId, limit);

    return {
      logs,
      count: logs.length,
      agent: {
        id: agent.id,
        fullName: `${agent.firstName} ${agent.lastName}`,
        email: agent.email
      }
    };
  }

  /**
   * Get logs for a specific session
   */
  async getSessionLogs(sessionId) {
    const logs = await ActivityLogRepository.findBySession(sessionId);

    return {
      logs,
      count: logs.length
    };
  }

  /**
   * Get logs by date range (Admin only)
   */
  async getLogsByDateRange(startDate, endDate, filters = {}) {
    const logs = await ActivityLogRepository.findByDateRange(startDate, endDate, filters);

    // Group by agent if needed
    const grouped = {};
    logs.forEach(log => {
      if (!grouped[log.agentId]) {
        grouped[log.agentId] = [];
      }
      grouped[log.agentId].push(log);
    });

    return {
      logs,
      count: logs.length,
      grouped: Object.keys(grouped).length > 0 ? grouped : null
    };
  }

  /**
   * Get activity statistics
   */
  async getActivityStats(agentId, startDate, endDate) {
    const logs = await ActivityLogRepository.findByDateRange(startDate, endDate, { agentId });

    const stats = {
      total: logs.length,
      byType: {},
      timeline: []
    };

    // Group by type
    logs.forEach(log => {
      stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    });

    // Timeline (by date)
    const dailyActivity = {};
    logs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      dailyActivity[date] = (dailyActivity[date] || 0) + 1;
    });

    stats.timeline = Object.entries(dailyActivity).map(([date, count]) => ({
      date,
      count
    }));

    return stats;
  }

  /**
   * Get recent activity across all agents (Admin dashboard)
   */
  async getRecentActivity(limit = 20, filters = {}) {
    const today = new Date().toISOString().split('T')[0];
    const logs = await ActivityLogRepository.findByDateRange(today, today, filters);

    // Sort by timestamp desc and limit
    const recentLogs = logs
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, limit);

    return {
      logs: recentLogs,
      count: recentLogs.length
    };
  }

  /**
   * Export logs to CSV format
   */
  async exportLogs(startDate, endDate, filters = {}) {
    const logs = await ActivityLogRepository.findByDateRange(startDate, endDate, filters);

    // Convert to CSV format
    const csvHeaders = ['Timestamp', 'Agent ID', 'Type', 'Action', 'Details'];
    const csvRows = logs.map(log => [
      log.timestamp,
      log.agentId,
      log.type,
      log.action,
      log.details || ''
    ]);

    return {
      headers: csvHeaders,
      rows: csvRows,
      count: csvRows.length
    };
  }
}

module.exports = new ActivityLogService();

