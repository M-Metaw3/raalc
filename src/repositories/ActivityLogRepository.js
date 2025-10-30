const { getConnection } = require('typeorm');

/**
 * ActivityLog Repository
 * 
 * Handles activity logging
 */
class ActivityLogRepository {
  /**
   * Create new activity log
   */
  async create(data) {
    const repository = getConnection().getRepository('ActivityLog');
    const log = repository.create(data);
    return await repository.save(log);
  }

  /**
   * Log agent activity
   */
  async logActivity(agentId, type, action, details = null, metadata = null, sessionId = null) {
    return await this.create({
      agentId,
      sessionId,
      type,
      action,
      details,
      metadata
    });
  }

  /**
   * Get activity logs for agent
   */
  async findByAgent(agentId, limit = 50) {
    const repository = getConnection().getRepository('ActivityLog');
    return await repository.find({
      where: { agentId },
      order: { timestamp: 'DESC' },
      take: limit
    });
  }

  /**
   * Get activity logs for session
   */
  async findBySession(sessionId) {
    const repository = getConnection().getRepository('ActivityLog');
    return await repository.find({
      where: { sessionId },
      order: { timestamp: 'ASC' }
    });
  }

  /**
   * Get activity logs by date range
   */
  async findByDateRange(startDate, endDate, filters = {}) {
    const repository = getConnection().getRepository('ActivityLog');
    const query = repository.createQueryBuilder('log')
      .where('log.timestamp BETWEEN :startDate AND :endDate', { 
        startDate: `${startDate} 00:00:00`,
        endDate: `${endDate} 23:59:59`
      });

    if (filters.agentId) {
      query.andWhere('log.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters.type) {
      query.andWhere('log.type = :type', { type: filters.type });
    }

    if (filters.sessionId) {
      query.andWhere('log.sessionId = :sessionId', { sessionId: filters.sessionId });
    }

    return await query
      .orderBy('log.timestamp', 'DESC')
      .getMany();
  }
}

module.exports = new ActivityLogRepository();

