const { getConnection } = require('typeorm');

/**
 * Complaint Repository
 * 
 * Handles all database operations for complaints
 * No business logic - only data access
 */
class ComplaintRepository {
  getRepository() {
    return getConnection().getRepository('Complaint');
  }

  /**
   * Create a new complaint
   * @param {Object} complaintData - Complaint data
   * @returns {Promise<Object>} Created complaint
   */
  async create(complaintData) {
    const repository = this.getRepository();
    const complaint = repository.create(complaintData);
    return await repository.save(complaint);
  }

  /**
   * Find complaint by ID
   * @param {number} id - Complaint ID
   * @returns {Promise<Object|null>} Complaint or null
   */
  async findById(id) {
    const repository = this.getRepository();
    return await repository
      .createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.user', 'user')
      .leftJoinAndSelect('complaint.resolver', 'resolver')
      .leftJoinAndSelect('complaint.department', 'department')
      .where('complaint.id = :id', { id })
      .andWhere('complaint.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Find all complaints with filters
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Complaints and total count
   */
  async findAll(filters = {}, pagination = {}) {
    const repository = this.getRepository();
    const queryBuilder = repository.createQueryBuilder('complaint')
      .leftJoinAndSelect('complaint.user', 'user')
      .leftJoinAndSelect('complaint.resolver', 'resolver')
      .leftJoinAndSelect('complaint.department', 'department')
      .where('complaint.deletedAt IS NULL');

    // Apply filters
    if (filters.status) {
      queryBuilder.andWhere('complaint.status = :status', { status: filters.status });
    }

    if (filters.complaintType) {
      queryBuilder.andWhere('complaint.complaintType = :complaintType', { 
        complaintType: filters.complaintType 
      });
    }

    if (filters.departmentId) {
      queryBuilder.andWhere('complaint.departmentId = :departmentId', { 
        departmentId: filters.departmentId 
      });
    }

    if (filters.userId) {
      queryBuilder.andWhere('complaint.userId = :userId', { userId: filters.userId });
    }

    if (filters.email) {
      queryBuilder.andWhere('complaint.email LIKE :email', { 
        email: `%${filters.email}%` 
      });
    }

    if (filters.search) {
      queryBuilder.andWhere(
        '(complaint.firstName LIKE :search OR complaint.lastName LIKE :search OR complaint.description LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    queryBuilder
      .orderBy('complaint.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    const complaints = await queryBuilder.getMany();

    return {
      complaints,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  /**
   * Find complaints by user ID
   * @param {number} userId - User ID
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} User complaints
   */
  async findByUserId(userId, pagination = {}) {
    return await this.findAll({ userId }, pagination);
  }

  /**
   * Update complaint
   * @param {number} id - Complaint ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Object>} Updated complaint
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Resolve complaint
   * @param {number} id - Complaint ID
   * @param {number} adminId - Admin ID who resolved
   * @param {string} resolutionNotes - Resolution notes
   * @returns {Promise<Object>} Updated complaint
   */
  async resolve(id, adminId, resolutionNotes = null) {
    return await this.update(id, {
      status: 'resolved',
      resolvedBy: adminId,
      resolvedAt: new Date(),
      resolutionNotes
    });
  }

  /**
   * Reject complaint
   * @param {number} id - Complaint ID
   * @param {number} adminId - Admin ID who rejected
   * @param {string} resolutionNotes - Rejection reason
   * @returns {Promise<Object>} Updated complaint
   */
  async reject(id, adminId, resolutionNotes = null) {
    return await this.update(id, {
      status: 'rejected',
      resolvedBy: adminId,
      resolvedAt: new Date(),
      resolutionNotes
    });
  }

  /**
   * Reopen complaint
   * @param {number} id - Complaint ID
   * @returns {Promise<Object>} Updated complaint
   */
  async reopen(id) {
    return await this.update(id, {
      status: 'pending',
      resolvedBy: null,
      resolvedAt: null,
      resolutionNotes: null
    });
  }

  /**
   * Soft delete complaint
   * @param {number} id - Complaint ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const repository = this.getRepository();
    await repository.update(id, {
      deletedAt: new Date()
    });
    return true;
  }

  /**
   * Get complaint statistics
   * @returns {Promise<Object>} Statistics
   */
  async getStatistics() {
    const repository = this.getRepository();
    
    const total = await repository.count({
      where: { deletedAt: null }
    });

    const byStatus = await repository
      .createQueryBuilder('complaint')
      .select('complaint.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('complaint.deletedAt IS NULL')
      .groupBy('complaint.status')
      .getRawMany();

    const byType = await repository
      .createQueryBuilder('complaint')
      .select('complaint.complaintType', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('complaint.deletedAt IS NULL')
      .groupBy('complaint.complaintType')
      .getRawMany();

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = parseInt(item.count);
        return acc;
      }, {}),
      byType: byType.reduce((acc, item) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {})
    };
  }
}

module.exports = new ComplaintRepository();

