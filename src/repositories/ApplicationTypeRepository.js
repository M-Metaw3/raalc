const { getRepository } = require('typeorm');

class ApplicationTypeRepository {
  getRepository() {
    return getRepository('ApplicationType');
  }

  /**
   * Create new application type
   */
  async create(typeData) {
    const repository = this.getRepository();
    const applicationType = repository.create(typeData);
    return await repository.save(applicationType);
  }

  /**
   * Find application type by ID
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id, deletedAt: null }
    });
  }

  /**
   * Find application type by ID with services
   */
  async findByIdWithServices(id) {
    return await this.getRepository()
      .createQueryBuilder('type')
      .leftJoinAndSelect('type.additionalServices', 'service', 'service.deletedAt IS NULL')
      .where('type.id = :id', { id })
      .andWhere('type.deletedAt IS NULL')
      .orderBy('service.order', 'ASC')
      .addOrderBy('service.createdAt', 'DESC')
      .getOne();
  }

  /**
   * Find by name (for uniqueness check)
   */
  async findByName(name) {
    return await this.getRepository().findOne({
      where: { name, deletedAt: null }
    });
  }

  /**
   * Find all application types with pagination and filters
   */
  async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      isActive,
      orderBy = 'order',
      orderDirection = 'ASC'
    } = filters;

    const skip = (page - 1) * limit;
    const queryBuilder = this.getRepository()
      .createQueryBuilder('type')
      .where('type.deletedAt IS NULL');

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(type.name LIKE :search OR type.nameAr LIKE :search OR type.description LIKE :search OR type.descriptionAr LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by active status
    if (isActive !== undefined) {
      queryBuilder.andWhere('type.isActive = :isActive', { isActive });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Order
    const validOrderFields = ['order', 'name', 'createdAt', 'updatedAt'];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'order';
    queryBuilder.orderBy(`type.${orderField}`, orderDirection);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const applicationTypes = await queryBuilder.getMany();

    return {
      applicationTypes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find all active types (simple list)
   */
  async findAllActive() {
    return await this.getRepository().find({
      where: { isActive: true, deletedAt: null },
      order: { order: 'ASC', name: 'ASC' }
    });
  }

  /**
   * Update application type
   */
  async update(id, updateData) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set(updateData)
      .where('id = :id', { id })
      .andWhere('deletedAt IS NULL')
      .execute();

    return await this.findById(id);
  }

  /**
   * Soft delete application type
   */
  async softDelete(id) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ deletedAt: new Date() })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Restore soft deleted type
   */
  async restore(id) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ deletedAt: null })
      .where('id = :id', { id })
      .execute();

    return await this.findById(id);
  }

  /**
   * Hard delete (permanent)
   */
  async hardDelete(id) {
    await this.getRepository()
      .createQueryBuilder()
      .delete()
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Get statistics
   */
  async getStatistics() {
    const repository = this.getRepository();

    const [total, active, inactive] = await Promise.all([
      repository.count({ where: { deletedAt: null } }),
      repository.count({ where: { isActive: true, deletedAt: null } }),
      repository.count({ where: { isActive: false, deletedAt: null } })
    ]);

    return {
      total,
      active,
      inactive
    };
  }

  /**
   * Count services for a type
   */
  async countServices(typeId) {
    const result = await getRepository('AdditionalService')
      .createQueryBuilder('service')
      .where('service.applicationTypeId = :typeId', { typeId })
      .andWhere('service.deletedAt IS NULL')
      .getCount();

    return result;
  }
}

module.exports = new ApplicationTypeRepository();

