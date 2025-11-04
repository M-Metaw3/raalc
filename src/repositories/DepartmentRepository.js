const { getRepository } = require('typeorm');

/**
 * Department Repository
 * Handles all database operations for Departments
 */
class DepartmentRepository {
  /**
   * Get TypeORM repository
   */
  getRepository() {
    return getRepository('Department');
  }

  /**
   * Create a new department
   */
  async create(departmentData) {
    const repository = this.getRepository();
    const department = repository.create(departmentData);
    return await repository.save(department);
  }

  /**
   * Find department by ID
   */
  async findById(id, includeDeleted = false) {
    const where = { id };
    if (!includeDeleted) {
      where.deletedAt = null;
    }

    return await this.getRepository().findOne({ where });
  }

  /**
   * Find department by name
   */
  async findByName(name, excludeId = null) {
    const query = this.getRepository()
      .createQueryBuilder('department')
      .where('department.name = :name', { name })
      .andWhere('department.deletedAt IS NULL');

    if (excludeId) {
      query.andWhere('department.id != :excludeId', { excludeId });
    }

    return await query.getOne();
  }

  /**
   * Find all departments with filters and pagination
   */
  async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive = null,
      sortBy = 'name',
      sortOrder = 'ASC'
    } = filters;

    const query = this.getRepository()
      .createQueryBuilder('department')
      .where('department.deletedAt IS NULL');

    // Search
    if (search) {
      query.andWhere('(department.name LIKE :search OR department.description LIKE :search)', {
        search: `%${search}%`
      });
    }

    // Filter by active status
    if (isActive !== null) {
      query.andWhere('department.isActive = :isActive', { isActive });
    }

    // Count total
    const total = await query.getCount();

    // Sort
    const validSortFields = ['name', 'createdAt', 'updatedAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    query.orderBy(`department.${sortField}`, sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC');

    // Pagination
    const skip = (page - 1) * limit;
    query.skip(skip).take(limit);

    const departments = await query.getMany();

    return {
      departments,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find department with services count
   */
  async findByIdWithServicesCount(id) {
    const department = await this.getRepository()
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.services', 'service', 'service.deletedAt IS NULL')
      .where('department.id = :id', { id })
      .andWhere('department.deletedAt IS NULL')
      .getOne();

    if (!department) {
      return null;
    }

    const servicesCount = department.services ? department.services.length : 0;
    
    return {
      ...department,
      servicesCount,
      services: undefined // Remove services array, only keep count
    };
  }

  /**
   * Find department with all services
   */
  async findByIdWithServices(id, includeInactive = false) {
    const query = this.getRepository()
      .createQueryBuilder('department')
      .leftJoinAndSelect('department.services', 'service', 'service.deletedAt IS NULL')
      .where('department.id = :id', { id })
      .andWhere('department.deletedAt IS NULL');

    if (!includeInactive) {
      query.andWhere('service.isActive = :isActive', { isActive: true });
    }

    query.orderBy('service.name', 'ASC');

    return await query.getOne();
  }

  /**
   * Update department
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
   * Soft delete department
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
   * Restore soft deleted department
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
   * Hard delete department (permanent)
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
   * Get department statistics
   */
  async getStatistics() {
    const stats = await this.getRepository()
      .createQueryBuilder('department')
      .select([
        'COUNT(*) as total',
        'COUNT(CASE WHEN department.isActive = 1 THEN 1 END) as active',
        'COUNT(CASE WHEN department.isActive = 0 THEN 1 END) as inactive'
      ])
      .where('department.deletedAt IS NULL')
      .getRawOne();

    return {
      total: parseInt(stats.total) || 0,
      active: parseInt(stats.active) || 0,
      inactive: parseInt(stats.inactive) || 0
    };
  }
}

module.exports = new DepartmentRepository();

