const { getRepository } = require('typeorm');

/**
 * Permission Repository
 * 
 * Handles database operations for permissions
 * Implements Repository Pattern for data abstraction
 */
class PermissionRepository {
  /**
   * Get TypeORM repository
   * @private
   */
  getRepository() {
    return getRepository('Permission');
  }

  /**
   * Create a new permission
   * @param {Object} permissionData - Permission data
   * @returns {Promise<Object>} Created permission
   */
  async create(permissionData) {
    const repository = this.getRepository();
    const permission = repository.create(permissionData);
    return await repository.save(permission);
  }

  /**
   * Create multiple permissions
   * @param {Array<Object>} permissionsData - Array of permission data
   * @returns {Promise<Array>} Created permissions
   */
  async createMany(permissionsData) {
    const repository = this.getRepository();
    const permissions = repository.create(permissionsData);
    return await repository.save(permissions);
  }

  /**
   * Find permission by ID
   * @param {number} id - Permission ID
   * @returns {Promise<Object|null>} Permission or null
   */
  async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { id }
    });
  }

  /**
   * Find permission by name
   * @param {string} name - Permission name
   * @returns {Promise<Object|null>} Permission or null
   */
  async findByName(name) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { name }
    });
  }

  /**
   * Find permissions by names
   * @param {Array<string>} names - Permission names
   * @returns {Promise<Array>} Array of permissions
   */
  async findByNames(names) {
    const repository = this.getRepository();
    return await repository
      .createQueryBuilder('permission')
      .where('permission.name IN (:...names)', { names })
      .getMany();
  }

  /**
   * Find permissions by resource
   * @param {string} resource - Resource name
   * @returns {Promise<Array>} Array of permissions
   */
  async findByResource(resource) {
    const repository = this.getRepository();
    return await repository.find({
      where: { resource, isActive: true },
      order: { action: 'ASC' }
    });
  }

  /**
   * Find permissions by group
   * @param {string} group - Group name
   * @returns {Promise<Array>} Array of permissions
   */
  async findByGroup(group) {
    const repository = this.getRepository();
    return await repository.find({
      where: { group, isActive: true },
      order: { resource: 'ASC', action: 'ASC' }
    });
  }

  /**
   * Get all permissions
   * @param {boolean} activeOnly - Return only active permissions
   * @returns {Promise<Array>} Array of permissions
   */
  async findAll(activeOnly = true) {
    const repository = this.getRepository();
    const where = activeOnly ? { isActive: true } : {};
    
    return await repository.find({
      where,
      order: { 
        group: 'ASC',
        resource: 'ASC', 
        action: 'ASC' 
      }
    });
  }

  /**
   * Get all permissions grouped by resource
   * @returns {Promise<Object>} Permissions grouped by resource
   */
  async findAllGroupedByResource() {
    const permissions = await this.findAll();
    
    const grouped = {};
    permissions.forEach(permission => {
      if (!grouped[permission.resource]) {
        grouped[permission.resource] = [];
      }
      grouped[permission.resource].push(permission);
    });
    
    return grouped;
  }

  /**
   * Get all permissions grouped by group
   * @returns {Promise<Object>} Permissions grouped by group
   */
  async findAllGroupedByGroup() {
    const permissions = await this.findAll();
    
    const grouped = {};
    permissions.forEach(permission => {
      const group = permission.group || 'Other';
      if (!grouped[group]) {
        grouped[group] = [];
      }
      grouped[group].push(permission);
    });
    
    return grouped;
  }

  /**
   * Update permission
   * @param {number} id - Permission ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated permission
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Delete permission
   * @param {number} id - Permission ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const repository = this.getRepository();
    const result = await repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Check if permission exists
   * @param {string} name - Permission name
   * @returns {Promise<boolean>} Exists status
   */
  async exists(name) {
    const repository = this.getRepository();
    const count = await repository.count({ where: { name } });
    return count > 0;
  }

  /**
   * Count permissions
   * @returns {Promise<number>} Count
   */
  async count() {
    const repository = this.getRepository();
    return await repository.count();
  }
}

module.exports = new PermissionRepository();

