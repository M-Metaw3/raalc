const { getRepository } = require('typeorm');

/**
 * ServiceRequestRepository
 * 
 * Handles all database operations for ServiceRequest entity
 */
class ServiceRequestRepository {
  /**
   * Get TypeORM repository
   */
  getRepository() {
    return getRepository('ServiceRequest');
  }

  /**
   * Create a new service request
   */
  async create(requestData) {
    const repository = this.getRepository();
    const request = repository.create(requestData);
    return await repository.save(request);
  }

  /**
   * Find service request by ID
   */
  async findById(requestId) {
    return await this.getRepository().findOne({
      where: { id: requestId, deletedAt: null },
      relations: ['user', 'category', 'agent', 'service', 'documents']
    });
  }

  /**
   * Find all requests by user ID
   */
  async findByUserId(userId, options = {}) {
    const { page = 1, limit = 10, status, categoryId } = options;

    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.agent', 'agent')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.documents', 'documents')
      .where('request.userId = :userId', { userId })
      .andWhere('request.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('request.categoryId = :categoryId', { categoryId });
    }

    queryBuilder
      .orderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find all requests assigned to an agent
   */
  async findByAgentId(agentId, options = {}) {
    const { page = 1, limit = 10, status, categoryId } = options;

    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.documents', 'documents')
      .where('request.agentId = :agentId', { agentId })
      .andWhere('request.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('request.categoryId = :categoryId', { categoryId });
    }

    queryBuilder
      .orderBy('request.priority', 'DESC')
      .addOrderBy('request.meetingDate', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find all requests (for admin)
   */
  async findAll(options = {}) {
    const { page = 1, limit = 10, status, categoryId, agentId, priority, searchTerm } = options;

    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.agent', 'agent')
      .leftJoinAndSelect('request.service', 'service')
      .leftJoinAndSelect('request.documents', 'documents')
      .where('request.deletedAt IS NULL');

    if (status) {
      queryBuilder.andWhere('request.status = :status', { status });
    }

    if (categoryId) {
      queryBuilder.andWhere('request.categoryId = :categoryId', { categoryId });
    }

    if (agentId) {
      queryBuilder.andWhere('request.agentId = :agentId', { agentId });
    }

    if (priority) {
      queryBuilder.andWhere('request.priority = :priority', { priority });
    }

    if (searchTerm) {
      queryBuilder.andWhere(
        '(request.fullName LIKE :search OR request.email LIKE :search OR request.phone LIKE :search OR request.notes LIKE :search)',
        { search: `%${searchTerm}%` }
      );
    }

    queryBuilder
      .orderBy('request.priority', 'DESC')
      .addOrderBy('request.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [requests, total] = await queryBuilder.getManyAndCount();

    return {
      requests,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Update service request
   */
  async update(requestId, updateData) {
    const repository = this.getRepository();
    await repository.update({ id: requestId }, updateData);
    return await this.findById(requestId);
  }

  /**
   * Soft delete service request
   */
  async softDelete(requestId) {
    return await this.update(requestId, { deletedAt: new Date() });
  }

  /**
   * Check if user has a pending request for same category
   */
  async hasPendingRequestForCategory(userId, categoryId) {
    const count = await this.getRepository().count({
      where: {
        userId,
        categoryId,
        status: 'pending',
        deletedAt: null
      }
    });
    return count > 0;
  }

  /**
   * Get requests statistics
   */
  async getStatistics(filters = {}) {
    const { agentId, categoryId, startDate, endDate } = filters;

    const queryBuilder = this.getRepository()
      .createQueryBuilder('request')
      .where('request.deletedAt IS NULL');

    if (agentId) {
      queryBuilder.andWhere('request.agentId = :agentId', { agentId });
    }

    if (categoryId) {
      queryBuilder.andWhere('request.categoryId = :categoryId', { categoryId });
    }

    if (startDate) {
      queryBuilder.andWhere('request.createdAt >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('request.createdAt <= :endDate', { endDate });
    }

    const total = await queryBuilder.getCount();

    const statusCounts = await queryBuilder
      .select('request.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.status')
      .getRawMany();

    const priorityCounts = await queryBuilder
      .select('request.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('request.priority')
      .getRawMany();

    return {
      total,
      byStatus: statusCounts.reduce((acc, curr) => {
        acc[curr.status] = parseInt(curr.count);
        return acc;
      }, {}),
      byPriority: priorityCounts.reduce((acc, curr) => {
        acc[curr.priority] = parseInt(curr.count);
        return acc;
      }, {})
    };
  }

  /**
   * Count documents for a request
   */
  async countDocuments(requestId) {
    const repository = getRepository('RequestDocument');
    return await repository.count({
      where: {
        requestId,
        deletedAt: null
      }
    });
  }

  /**
   * Get upcoming meetings for an agent
   */
  async getUpcomingMeetings(agentId, days = 7) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + days);

    return await this.getRepository()
      .createQueryBuilder('request')
      .leftJoinAndSelect('request.user', 'user')
      .leftJoinAndSelect('request.category', 'category')
      .leftJoinAndSelect('request.service', 'service')
      .where('request.agentId = :agentId', { agentId })
      .andWhere('request.status IN (:...statuses)', { statuses: ['approved', 'pending'] })
      .andWhere('request.meetingDate >= :today', { today: today.toISOString().split('T')[0] })
      .andWhere('request.meetingDate <= :futureDate', { futureDate: futureDate.toISOString().split('T')[0] })
      .andWhere('request.deletedAt IS NULL')
      .orderBy('request.meetingDate', 'ASC')
      .addOrderBy('request.meetingTime', 'ASC')
      .getMany();
  }
}

module.exports = new ServiceRequestRepository();

