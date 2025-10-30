const { getConnection, In } = require('typeorm');

/**
 * AgentSession Repository
 * 
 * Handles agent work session data access
 */
class AgentSessionRepository {
  /**
   * Find session by ID
   */
  async findById(id) {
    const repository = getConnection().getRepository('AgentSession');
    return await repository.findOne({
      where: { id },
      relations: ['agent', 'shift', 'breakRequests']
    });
  }

  /**
   * Get today's active session for agent
   */
  async findTodaySession(agentId) {
    const repository = getConnection().getRepository('AgentSession');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    return await repository.findOne({
      where: {
        agentId,
        date: today,
        status: 'active'
      },
      relations: ['shift', 'breakRequests']
    });
  }

  /**
   * Get agent's session for specific date
   */
  async findByAgentAndDate(agentId, date) {
    const repository = getConnection().getRepository('AgentSession');
    return await repository.findOne({
      where: { agentId, date },
      relations: ['shift', 'breakRequests']
    });
  }

  /**
   * Get agent's active session (any status except completed)
   */
  async findActiveSession(agentId) {
    const repository = getConnection().getRepository('AgentSession');
    const today = new Date().toISOString().split('T')[0];
    
    return await repository.findOne({
      where: {
        agentId,
        date: today,
        status: In(['active', 'on_break'])
      },
      relations: ['shift', 'breakRequests']
    });
  }

  /**
   * Create new session
   */
  async create(data) {
    const repository = getConnection().getRepository('AgentSession');
    const session = repository.create(data);
    return await repository.save(session);
  }

  /**
   * Update session
   */
  async update(id, data) {
    const repository = getConnection().getRepository('AgentSession');
    await repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Get sessions for date range
   */
  async findByDateRange(startDate, endDate, filters = {}) {
    const repository = getConnection().getRepository('AgentSession');
    const query = repository.createQueryBuilder('session')
      .leftJoinAndSelect('session.agent', 'agent')
      .leftJoinAndSelect('session.shift', 'shift')
      .where('session.date BETWEEN :startDate AND :endDate', { startDate, endDate });

    if (filters.agentId) {
      query.andWhere('session.agentId = :agentId', { agentId: filters.agentId });
    }

    if (filters.departmentId) {
      query.andWhere('agent.departmentId = :departmentId', { departmentId: filters.departmentId });
    }

    if (filters.status) {
      query.andWhere('session.status = :status', { status: filters.status });
    }

    return await query
      .orderBy('session.date', 'DESC')
      .addOrderBy('session.checkIn', 'DESC')
      .getMany();
  }

  /**
   * Calculate total work minutes for a session
   */
  async calculateWorkTime(sessionId) {
    const session = await this.findById(sessionId);
    if (!session || !session.checkOut) {
      return null;
    }

    const checkInTime = new Date(session.checkIn);
    const checkOutTime = new Date(session.checkOut);
    const totalMinutes = Math.floor((checkOutTime - checkInTime) / 60000);
    const workMinutes = totalMinutes - (session.totalBreakMinutes || 0);

    return {
      totalMinutes,
      breakMinutes: session.totalBreakMinutes || 0,
      workMinutes
    };
  }

  /**
   * Get incomplete sessions (not checked out)
   */
  async findIncompleteSessions() {
    const repository = getConnection().getRepository('AgentSession');
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    return await repository.find({
      where: {
        date: yesterdayDate,
        checkOut: null,
        status: In(['active', 'on_break'])
      },
      relations: ['agent', 'shift']
    });
  }
}

module.exports = new AgentSessionRepository();

