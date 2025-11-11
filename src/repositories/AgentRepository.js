const { getConnection } = require('typeorm');

/**
 * Agent Repository
 * Handles all database operations for Agent entity
 */
class AgentRepository {
  constructor() {
    this.getRepository = () => getConnection().getRepository('Agent');
  }

  /**
   * Create a new agent
   * @param {Object} agentData - Agent data
   * @returns {Promise<Object>} Created agent
   */
  async create(agentData) {
    const repository = this.getRepository();
    const agent = repository.create(agentData);
    return await repository.save(agent);
  }

  /**
   * Find agent by ID
   * @param {number} id - Agent ID
   * @param {boolean} includePassword - Whether to include password in result
   * @param {Array} relations - Relations to load
   * @returns {Promise<Object|null>} Agent object or null
   */
  async findById(id, includePassword = false, relations = []) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('agent')
      .where('agent.id = :id', { id })
      .andWhere('agent.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('agent.password');
    }
    
    // Load relations if specified
    if (relations.includes('department')) {
      query.leftJoinAndSelect('agent.department', 'department');
    }
    
    if (relations.includes('shift')) {
      query.leftJoinAndSelect('agent.shift', 'shift');
    }
    
    if (relations.includes('sessions')) {
      query.leftJoinAndSelect('agent.sessions', 'sessions');
    }
    
    if (relations.includes('breakRequests')) {
      query.leftJoinAndSelect('agent.breakRequests', 'breakRequests');
    }
    
    if (relations.includes('activityLogs')) {
      query.leftJoinAndSelect('agent.activityLogs', 'activityLogs');
    }
    
    if (relations.includes('creator')) {
      query.leftJoinAndSelect('agent.creator', 'creator');
    }
    
    return await query.getOne();
  }

  /**
   * Find agent by email
   * @param {string} email - Agent email
   * @param {boolean} includePassword - Whether to include password in result
   * @returns {Promise<Object|null>} Agent object or null
   */
  async findByEmail(email, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('agent')
      .where('agent.email = :email', { email })
      .andWhere('agent.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('agent.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find agent by email or phone
   * @param {string} identifier - Email or phone number
   * @param {boolean} includePassword - Include password field
   * @returns {Promise<Object|null>} Agent object or null
   */
  async findByEmailOrPhone(identifier, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('agent')
      .where('agent.email = :identifier', { identifier })
      .orWhere('agent.phone = :identifier', { identifier })
      .andWhere('agent.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('agent.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find agent by email verification token
   * @param {string} token - Email verification token
   * @returns {Promise<Object|null>} Agent object or null
   */
  async findByEmailVerificationToken(token) {
    const repository = this.getRepository();
    return await repository.createQueryBuilder('agent')
      .addSelect('agent.emailVerificationToken')
      .addSelect('agent.emailVerificationExpires')
      .where('agent.emailVerificationToken = :token', { token })
      .andWhere('agent.emailVerificationExpires > :now', { now: new Date() })
      .andWhere('agent.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Find agent by password reset token
   * @param {string} token - Password reset token
   * @returns {Promise<Object|null>} Agent object or null
   */
  async findByPasswordResetToken(token) {
    const repository = this.getRepository();
    return await repository.createQueryBuilder('agent')
      .addSelect('agent.passwordResetToken')
      .addSelect('agent.passwordResetExpires')
      .addSelect('agent.password')
      .where('agent.passwordResetToken = :token', { token })
      .andWhere('agent.passwordResetExpires > :now', { now: new Date() })
      .andWhere('agent.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Update agent data
   * @param {number} id - Agent ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated agent
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Soft delete agent
   * @param {number} id - Agent ID
   * @returns {Promise<boolean>} Success status
   */
  async softDelete(id) {
    const repository = this.getRepository();
    await repository.update(id, { deletedAt: new Date() });
    return true;
  }

  /**
   * Find all agents pending approval
   * @param {number} page - Page number
   * @param {number} limit - Items per page
   * @returns {Promise<Object>} Paginated agents
   */
  async findPendingAgents(page = 1, limit = 20) {
    const repository = this.getRepository();
    const skip = (page - 1) * limit;
    
    const [agents, total] = await repository.createQueryBuilder('agent')
      .where('agent.isActive = :isActive', { isActive: false })
      .andWhere('agent.approvedBy IS NULL')
      .andWhere('agent.rejectedBy IS NULL')
      .andWhere('agent.deletedAt IS NULL')
      .orderBy('agent.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    return {
      data: agents,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find all agents with filtering
   * @param {Object} options - Options object
   * @param {Object} options.where - Filter criteria (featured, isActive, etc.)
   * @param {number} options.skip - Number of records to skip
   * @param {number} options.limit - Number of records to return
   * @param {Array} options.relations - Relations to load (e.g., ['department', 'shift'])
   * @returns {Promise<Object>} Paginated agents with pagination info
   */
  async findAll(options = {}) {
    const repository = this.getRepository();
    const { where = {}, skip = 0, limit = 20, relations = [] } = options;
    
    const query = repository.createQueryBuilder('agent')
      .where('agent.deletedAt IS NULL');
    
    // Apply where filters
    if (where.isActive !== undefined) {
      query.andWhere('agent.isActive = :isActive', { isActive: where.isActive });
    }
    
    if (where.featured !== undefined) {
      query.andWhere('agent.featured = :featured', { featured: where.featured });
    }
    
    if (where.search) {
      query.andWhere(
        '(agent.fullName LIKE :search OR agent.email LIKE :search OR agent.agencyName LIKE :search)',
        { search: `%${where.search}%` }
      );
    }
    
    // Load relations
    if (relations.includes('department')) {
      query.leftJoinAndSelect('agent.department', 'department');
    }
    
    if (relations.includes('shift')) {
      query.leftJoinAndSelect('agent.shift', 'shift');
    }
    
    const [agents, total] = await query
      .orderBy('agent.createdAt', 'DESC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();
    
    const currentPage = Math.floor(skip / limit) + 1;
    
    return {
      data: agents,
      pagination: {
        currentPage,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit
      }
    };
  }

  /**
   * Count all agents
   * @returns {Promise<number>} Count
   */
  async count() {
    const repository = this.getRepository();
    return await repository.count({
      where: { deletedAt: null }
    });
  }

  /**
   * Update last login information
   * @param {number} agentId - Agent ID
   * @param {string} ip - IP address
   * @returns {Promise<boolean>} Success status
   */
  async updateLastLogin(agentId, ip) {
    const repository = this.getRepository();
    await repository.update(agentId, {
      lastLoginAt: new Date(),
      lastLoginIp: ip
    });
    return true;
  }
}

module.exports = new AgentRepository();

