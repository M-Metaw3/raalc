const { getRepository } = require('typeorm');

class AdditionalServiceRepository {
  getRepository() {
    return getRepository('AdditionalService');
  }

  /**
   * Create new additional service
   */
  async create(serviceData) {
    const repository = this.getRepository();
    const service = repository.create(serviceData);
    return await repository.save(service);
  }

  /**
   * Find service by ID
   */
  async findById(id) {
    return await this.getRepository().findOne({
      where: { id, deletedAt: null },
      relations: ['applicationType']
    });
  }

  /**
   * Find by name within application type (for uniqueness check)
   */
  async findByNameInType(name, applicationTypeId, excludeId = null) {
    const queryBuilder = this.getRepository()
      .createQueryBuilder('service')
      .where('service.name = :name', { name })
      .andWhere('service.applicationTypeId = :applicationTypeId', { applicationTypeId })
      .andWhere('service.deletedAt IS NULL');

    if (excludeId) {
      queryBuilder.andWhere('service.id != :excludeId', { excludeId });
    }

    return await queryBuilder.getOne();
  }

  /**
   * Find all services with pagination and filters
   */
  async findAll(filters = {}) {
    const {
      page = 1,
      limit = 20,
      search = '',
      applicationTypeId,
      isActive,
      isFeatured,
      isRequired,
      includeDeleted = false,
      deletedOnly = false,
      minPrice,
      maxPrice,
      orderBy = 'order',
      orderDirection = 'ASC'
    } = filters;

    const skip = (page - 1) * limit;
    const queryBuilder = this.getRepository()
      .createQueryBuilder('service')
      .leftJoinAndSelect('service.applicationType', 'type');

    // Handle deleted filter
    if (deletedOnly) {
      // Show only deleted items
      queryBuilder.where('service.deletedAt IS NOT NULL');
    } else if (!includeDeleted) {
      // Default: exclude deleted items
      queryBuilder.where('service.deletedAt IS NULL');
    }
    // If includeDeleted is true, no filter on deletedAt (show all)

    // Search
    if (search) {
      queryBuilder.andWhere(
        '(service.name LIKE :search OR service.nameAr LIKE :search OR service.description LIKE :search OR service.descriptionAr LIKE :search)',
        { search: `%${search}%` }
      );
    }

    // Filter by application type
    if (applicationTypeId) {
      queryBuilder.andWhere('service.applicationTypeId = :applicationTypeId', { applicationTypeId });
    }

    // Filter by active status
    if (isActive !== undefined) {
      queryBuilder.andWhere('service.isActive = :isActive', { isActive });
    }

    // Filter by featured
    if (isFeatured !== undefined) {
      queryBuilder.andWhere('service.isFeatured = :isFeatured', { isFeatured });
    }

    // Filter by required
    if (isRequired !== undefined) {
      queryBuilder.andWhere('service.isRequired = :isRequired', { isRequired });
    }

    // Filter by price range
    if (minPrice !== undefined) {
      queryBuilder.andWhere('service.price >= :minPrice', { minPrice });
    }
    if (maxPrice !== undefined) {
      queryBuilder.andWhere('service.price <= :maxPrice', { maxPrice });
    }

    // Count total
    const total = await queryBuilder.getCount();

    // Order
    const validOrderFields = ['order', 'name', 'price', 'createdAt', 'updatedAt', 'deletedAt'];
    const orderField = validOrderFields.includes(orderBy) ? orderBy : 'order';
    queryBuilder.orderBy(`service.${orderField}`, orderDirection);

    // Pagination
    queryBuilder.skip(skip).take(limit);

    const services = await queryBuilder.getMany();

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find services by application type
   */
  async findByApplicationType(applicationTypeId, activeOnly = false) {
    const where = {
      applicationTypeId,
      deletedAt: null
    };

    if (activeOnly) {
      where.isActive = true;
    }

    return await this.getRepository().find({
      where,
      order: { order: 'ASC', createdAt: 'DESC' }
    });
  }

  /**
   * Find featured services
   */
  async findFeatured(limit = 10) {
    return await this.getRepository().find({
      where: {
        isFeatured: true,
        isActive: true,
        deletedAt: null
      },
      relations: ['applicationType'],
      order: { order: 'ASC', createdAt: 'DESC' },
      take: limit
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
      .andWhere('deletedAt IS NULL')
      .execute();

    return await this.findById(id);
  }

  /**
   * Soft delete service
   */
  async softDelete(id) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ 
        deletedAt: new Date(),
        isActive: false  // Deactivate service when deleted
      })
      .where('id = :id', { id })
      .execute();
  }

  /**
   * Restore soft deleted service
   */
  async restore(id) {
    await this.getRepository()
      .createQueryBuilder()
      .update()
      .set({ 
        deletedAt: null,
        isActive: true  // Reactivate service when restored
      })
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

    const [total, active, inactive, featured, required] = await Promise.all([
      repository.count({ where: { deletedAt: null } }),
      repository.count({ where: { isActive: true, deletedAt: null } }),
      repository.count({ where: { isActive: false, deletedAt: null } }),
      repository.count({ where: { isFeatured: true, deletedAt: null } }),
      repository.count({ where: { isRequired: true, deletedAt: null } })
    ]);

    // Average price
    const avgResult = await repository
      .createQueryBuilder('service')
      .select('AVG(service.price)', 'avgPrice')
      .where('service.deletedAt IS NULL')
      .getRawOne();

    return {
      total,
      active,
      inactive,
      featured,
      required,
      averagePrice: parseFloat(avgResult.avgPrice) || 0
    };
  }

  /**
   * Get statistics by application type
   */
  async getStatisticsByType(applicationTypeId) {
    const repository = this.getRepository();

    const [total, active] = await Promise.all([
      repository.count({ 
        where: { 
          applicationTypeId, 
          deletedAt: null 
        } 
      }),
      repository.count({ 
        where: { 
          applicationTypeId,
          isActive: true,
          deletedAt: null 
        } 
      })
    ]);

    return {
      total,
      active
    };
  }

  /**
   * Update image path
   */
  async updateImage(id, imagePath) {
    return await this.update(id, { image: imagePath });
  }

  /**
   * Bulk update order
   */
  async updateOrder(orderData) {
    const promises = orderData.map(({ id, order }) =>
      this.getRepository()
        .createQueryBuilder()
        .update()
        .set({ order })
        .where('id = :id', { id })
        .execute()
    );

    await Promise.all(promises);
  }
}

module.exports = new AdditionalServiceRepository();

