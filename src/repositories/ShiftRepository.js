const { getConnection } = require('typeorm');

/**
 * Shift Repository
 * 
 * Handles shift data access
 */
class ShiftRepository {
  /**
   * Get all active shifts
   */
  async findAll() {
    const repository = getConnection().getRepository('Shift');
    return await repository.find({
      where: { isActive: true },
      relations: ['department', 'breakPolicy'],
      order: { name: 'ASC' }
    });
  }

  /**
   * Find shift by ID with relations
   */
  async findById(id) {
    const repository = getConnection().getRepository('Shift');
    return await repository.findOne({
      where: { id },
      relations: ['department', 'breakPolicy']
    });
  }

  /**
   * Find shifts by department
   */
  async findByDepartment(departmentId) {
    const repository = getConnection().getRepository('Shift');
    return await repository.find({
      where: { departmentId, isActive: true },
      relations: ['breakPolicy']
    });
  }

  /**
   * Get shift with break policy
   */
  async findWithPolicy(id) {
    const repository = getConnection().getRepository('Shift');
    return await repository.findOne({
      where: { id },
      relations: ['breakPolicy']
    });
  }

  /**
   * Create new shift
   */
  async create(data) {
    const repository = getConnection().getRepository('Shift');
    const shift = repository.create(data);
    return await repository.save(shift);
  }

  /**
   * Update shift
   */
  async update(id, data) {
    const repository = getConnection().getRepository('Shift');
    await repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Check if shift time overlaps with existing shifts
   */
  async hasOverlap(startTime, endTime, excludeId = null) {
    const repository = getConnection().getRepository('Shift');
    const query = repository.createQueryBuilder('shift')
      .where('shift.isActive = :isActive', { isActive: true })
      .andWhere('(shift.startTime < :endTime AND shift.endTime > :startTime)', {
        startTime,
        endTime
      });

    if (excludeId) {
      query.andWhere('shift.id != :excludeId', { excludeId });
    }

    const count = await query.getCount();
    return count > 0;
  }
}

module.exports = new ShiftRepository();

