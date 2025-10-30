const { getConnection } = require('typeorm');

/**
 * Department Repository
 * 
 * Handles department data access
 */
class DepartmentRepository {
  /**
   * Get all active departments
   */
  async findAll() {
    const repository = getConnection().getRepository('Department');
    return await repository.find({
      where: { isActive: true },
      order: { name: 'ASC' }
    });
  }

  /**
   * Find department by ID
   */
  async findById(id) {
    const repository = getConnection().getRepository('Department');
    return await repository.findOne({ where: { id } });
  }

  /**
   * Create new department
   */
  async create(data) {
    const repository = getConnection().getRepository('Department');
    const department = repository.create(data);
    return await repository.save(department);
  }

  /**
   * Update department
   */
  async update(id, data) {
    const repository = getConnection().getRepository('Department');
    await repository.update(id, data);
    return await this.findById(id);
  }

  /**
   * Check if department exists
   */
  async exists(name) {
    const repository = getConnection().getRepository('Department');
    const count = await repository.count({ where: { name } });
    return count > 0;
  }
}

module.exports = new DepartmentRepository();

