const { getRepository } = require('typeorm');

/**
 * Service Repository
 * Handles all database operations for Services
 */
class ServiceRepository {
  /**
   * Get TypeORM repository
   */
  getRepository() {
    return getRepository('Service');
  }

  /**
   * Create a new service
   */
  async create(serviceData) {
    const repository = this.getRepository();
    const service = repository.create(serviceData);
    return await repository.save(service);
  }

  /**
   * Find service by ID
   */
  async findById(id, includeDeleted = false) {
    const where = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return await this.getRepository().findOne({
      where,
      relations: ['department']
    });
  }

  /**
   * Find service by name and department
   */
  async findByNameAndDepartment(name, departmentId, excludeId = null) {
    const query = this.getRepository()
      .createQueryBuilder('service')
      .where('service.name = :name', { name })
      .andWhere('service.departmentId = :departmentId', { departmentId })
      .andWhere('service.deletedAt IS NULL');

    if (excludeId) {
      query.andWhere('service.id != :excludeId', { excludeId });
    }

    return await query.getOne();
  }

  /**
   * Find all services with filters and pagination
   */
  async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      departmentId = null,
      isActive = null,
      minPrice = null,
      maxPrice = null,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = filters;

    const query = this.getRepository()
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.department', 'department')
      .where('service.deletedAt IS NULL');

    // Search
    if (search) {
      query.andWhere('(service.name LIKE :search OR service.description LIKE :search)', {
        search: `%${search}%`
      });
    }

    // Filter by department
    if (departmentId) {
      query.andWhere('service.departmentId = :departmentId', { departmentId });
    }

    // Filter by active status
    if (isActive !== null) {
      query.andWhere('service.isActive = :isActive', { isActive });
    }

    // Filter by price range
    if (minPrice !== null) {
      query.andWhere('service.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== null) {
      query.andWhere('service.price <= :maxPrice', { maxPrice });
    }

    // Also filter active departments
    query.andWhere('department.deletedAt IS NULL');
    query.andWhere('department.isActive = :deptActive', { deptActive: true });

    // Count total
    const total = await query.getCount();

    // Sort
    const validSortFields = ['name', 'price', 'duration', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    query.orderBy(`service.${sortField}`, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const services = await query.getMany();

    return {
      services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find services by department ID
   */
  async findByDepartmentId(departmentId, includeInactive = false) {
    const where = {
      departmentId,
      deletedAt: null
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.getRepository().find({
      where,
      order: {
        name: 'ASC'
      }
    });
  }

  /**
   * Update service
   */
  async update(id, updateData) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where('id = :id', { id })
      .execute();

    return await this.findById(id);
  }

  /**
   * Soft delete service
   */
  async softDelete(id) {
    const result = await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ deletedAt: new Date() })
      .where('id = :id', { id })
      .andWhere('deletedAt IS NULL')
      .execute();

    return result.affected > 0;
  }

  /**
   * Restore soft deleted service
   */
  async restore(id) {
    const result = await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ deletedAt: null })
      .where('id = :id', { id })
      .execute();

    return result.affected > 0;
  }

  /**
   * Hard delete service (permanent)
   */
  async hardDelete(id) {
    const result = await this.getRepository()
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();

    return result.affected > 0;
  }

  /**
   * Count services by department
   */
  async countByDepartment(departmentId, includeInactive = false) {
    const where = {
      departmentId,
      deletedAt: null
    };

    if (!includeInactive) {
      where.isActive = true;
    }

    return await this.getRepository().count({ where });
  }

  /**
   * Get service statistics
   */
  async getStatistics() {
    const stats = await this.getRepository()
      .createQueryBuilder('service')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN service.isActive = 1 THEN 1 END) as active',
        'COUNT(CASE WHEN service.isActive = 0 THEN 1 END) as inactive',
        'AVG(service.price) as averagePrice',
        'MIN(service.price) as minPrice',
        'MAX(service.price) as maxPrice'
      ])
      .where('service.deletedAt IS NULL')
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      inactive: parseInt(stats.inactive) || 0,
      averagePrice: parseFloat(stats.averagePrice) || 0,
      minPrice: parseFloat(stats.minPrice) || 0,
      maxPrice: parseFloat(stats.maxPrice) || 0
    };
  }
}

module.exports = new ServiceRepository();

