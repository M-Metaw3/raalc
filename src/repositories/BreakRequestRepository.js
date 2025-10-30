const { getConnection, In } = require('typeorm');

/**
 * BreakRequest Repository
 * 
 * Handles break request data access
 */
class BreakRequestRepository {
  /**
   * Find break request by ID
   */
  async findById(id) {
    const repository = getConnection().getRepository('BreakRequest');
    return await repository.findOne({
      where: { id },
      relations: ['agent', 'session', 'policy', 'reviewer']
    });
  }

  /**
   * Get today's breaks for agent
   */
  async findTodayBreaks(agentId) {
    const repository = getConnection().getRepository('BreakRequest');
    const today = new Date().toISOString().split('T')[0];
    
    return await repository
      .createQueryBuilder('break')
      .leftJoin('break.session', 'session')
      .where('break.agentId = :agentId', { agentId })
      .andWhere('session.date = :today', { today })
      .andWhere('break.status IN (:...statuses)', {
        statuses: ['approved', 'active', 'completed']
      })
      .orderBy('break.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Count today's completed breaks for agent
   */
  async countTodayBreaks(agentId) {
    const breaks = await this.findTodayBreaks(agentId);
    return breaks.length;
  }

  /**
   * Get agent's last break
   */
  async findLastBreak(agentId) {
    const repository = getConnection().getRepository('BreakRequest');
    return await repository.findOne({
      where: {
        agentId,
        status: In(['completed', 'active'])
      },
      order: { endTime: 'DESC' }
    });
  }

  /**
   * Get active break for agent
   */
  async findActiveBreak(agentId) {
    const repository = getConnection().getRepository('BreakRequest');
    return await repository.findOne({
      where: {
        agentId,
        status: 'active'
      },
      relations: ['session']
    });
  }

  /**
   * Get breaks by session
   */
  async findBySession(sessionId) {
    const repository = getConnection().getRepository('BreakRequest');
    return await repository.find({
      where: { sessionId },
      order: { createdAt: 'ASC' }
    });
  }

  /**
   * Get pending break requests (for admin approval)
   */
  async findPendingRequests(filters = {}) {
    const repository = getConnection().getRepository('BreakRequest');
    const query = repository.createQueryBuilder('break')
      .leftJoinAndSelect('break.agent', 'agent')
      .leftJoinAndSelect('break.session', 'session')
      .leftJoinAndSelect('agent.department', 'department')
      .where('break.status = :status', { status: 'pending' });

    if (filters.departmentId) {
      query.andWhere('agent.departmentId = :departmentId', { 
        departmentId: filters.departmentId 
      });
    }

    if (filters.agentId) {
      query.andWhere('break.agentId = :agentId', { agentId: filters.agentId });
    }

    return await query
      .orderBy('break.createdAt', 'ASC')
      .getMany();
  }

  /**
   * Create new break request
   */
  async create(data) {
    const repository = getConnection().getRepository('BreakRequest');
    const breakRequest = repository.create(data);
    return await repository.save(breakRequest);
  }

  /**
   * Update break request
   */
  async update(id, data) {
    const repository = getConnection().getRepository('BreakRequest');
    await repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Approve break request
   */
  async approve(id, reviewerId, notes = null) {
    const repository = getConnection().getRepository('BreakRequest');
    await repository.update(id, {
      status: 'approved',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: notes
    });
    return await this.findById(id);
  }

  /**
   * Reject break request
   */
  async reject(id, reviewerId, reason) {
    const repository = getConnection().getRepository('BreakRequest');
    await repository.update(id, {
      status: 'rejected',
      reviewedBy: reviewerId,
      reviewedAt: new Date(),
      rejectionReason: reason
    });
    return await this.findById(id);
  }

  /**
   * Start break (change status to active)
   */
  async startBreak(id) {
    const repository = getConnection().getRepository('BreakRequest');
    await repository.update(id, {
      status: 'active',
      startTime: new Date()
    });
    return await this.findById(id);
  }

  /**
   * End break (change status to completed)
   */
  async endBreak(id) {
    const breakRequest = await this.findById(id);
    if (!breakRequest || !breakRequest.startTime) {
      return null;
    }

    const endTime = new Date();
    const startTime = new Date(breakRequest.startTime);
    const actualDuration = Math.floor((endTime - startTime) / 60000);

    const repository = getConnection().getRepository('BreakRequest');
    await repository.update(id, {
      status: 'completed',
      endTime,
      actualDuration
    });

    return await this.findById(id);
  }

  /**
   * Get break statistics for agent
   */
  async getAgentBreakStats(agentId, startDate, endDate) {
    const repository = getConnection().getRepository('BreakRequest');
    const breaks = await repository
      .createQueryBuilder('break')
      .leftJoin('break.session', 'session')
      .where('break.agentId = :agentId', { agentId })
      .andWhere('session.date BETWEEN :startDate AND :endDate', { startDate, endDate })
      .andWhere('break.status = :status', { status: 'completed' })
      .getMany();

    const totalBreaks = breaks.length;
    const totalMinutes = breaks.reduce((sum, b) => sum + (b.actualDuration || 0), 0);
    const avgDuration = totalBreaks > 0 ? Math.round(totalMinutes / totalBreaks) : 0;

    const byType = breaks.reduce((acc, b) => {
      acc[b.type] = (acc[b.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalBreaks,
      totalMinutes,
      avgDuration,
      byType
    };
  }
}

module.exports = new BreakRequestRepository();

