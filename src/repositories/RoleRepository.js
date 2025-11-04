const { getRepository, In } = require('typeorm');

/**
 * Role Repository
 * 
 * Handles database operations for roles with SOLID principles
 * Implements Repository Pattern for data abstraction
 */
class RoleRepository {
  /**
   * Get TypeORM repository
   * @private
   */
  getRepository() {
    return getRepository('Role');
  }

  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @returns {Promise<Object>} Created role
   */
  async create(roleData) {
    const repository = this.getRepository();
    const role = repository.create(roleData);
    return await repository.save(role);
  }

  /**
   * Find role by ID
   * @param {number} id - Role ID
   * @returns {Promise<Object|null>} Role or null
   */
  async findById(id) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { id }
    });
  }

  /**
   * Find role by name
   * @param {string} name - Role name
   * @returns {Promise<Object|null>} Role or null
   */
  async findByName(name) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { name }
    });
  }

  /**
   * Find role by slug
   * @param {string} slug - Role slug
   * @returns {Promise<Object|null>} Role or null
   */
  async findBySlug(slug) {
    const repository = this.getRepository();
    return await repository.findOne({
      where: { slug }
    });
  }

  /**
   * Get all roles
   * @param {boolean} activeOnly - Return only active roles
   * @returns {Promise<Array>} Array of roles
   */
  async findAll(activeOnly = false) {
    const repository = this.getRepository();
    const where = activeOnly ? { isActive: true } : {};
    
    return await repository.find({
      where,
      order: { name: 'ASC' }
    });
  }

  /**
   * Update role
   * @param {number} id - Role ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated role
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Delete role
   * @param {number} id - Role ID
   * @returns {Promise<boolean>} Success status
   */
  async delete(id) {
    const repository = this.getRepository();
    const result = await repository.delete(id);
    return result.affected > 0;
  }

  /**
   * Assign permissions to role
   * @param {number} roleId - Role ID
   * @param {Array<number>} permissionIds - Permission IDs
   * @param {number} grantedBy - Admin ID who granted
   * @returns {Promise<boolean>} Success status
   */
  async assignPermissions(roleId, permissionIds, grantedBy = null) {
    const rolePermissionRepo = getRepository('RolePermission');
    
    const rolePermissions = permissionIds.map(permissionId => ({
      roleId,
      permissionId,
      grantedBy,
      grantedAt: new Date()
    }));
    
    await rolePermissionRepo.insert(rolePermissions);
    return true;
  }

  /**
   * Remove permissions from role
   * @param {number} roleId - Role ID
   * @param {Array<number>} permissionIds - Permission IDs (optional, if not provided removes all)
   * @returns {Promise<boolean>} Success status
   */
  async removePermissions(roleId, permissionIds = null) {
    const rolePermissionRepo = getRepository('RolePermission');
    
    const where = { roleId };
    if (permissionIds && permissionIds.length > 0) {
      where.permissionId = In(permissionIds);
    }
    
    const result = await rolePermissionRepo.delete(where);
    return result.affected > 0;
  }

  /**
   * Get role with permissions
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} Role with permissions
   */
  async findWithPermissions(roleId) {
    const repository = this.getRepository();
    
    return await repository
      .createQueryBuilder('role')
      .leftJoinAndSelect('RolePermission', 'rp', 'rp.roleId = role.id')
      .leftJoinAndSelect('Permission', 'permission', 'permission.id = rp.permissionId')
      .where('role.id = :roleId', { roleId })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .getOne();
  }

  /**
   * Get role permissions
   * @param {number} roleId - Role ID
   * @returns {Promise<Array>} Array of permissions
   */
  async getPermissions(roleId) {
    const permissionRepo = getRepository('Permission');
    
    return await permissionRepo
      .createQueryBuilder('permission')
      .innerJoin('RolePermission', 'rp', 'rp.permissionId = permission.id')
      .where('rp.roleId = :roleId', { roleId })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .orderBy('permission.resource', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getMany();
  }

  /**
   * Count roles
   * @returns {Promise<number>} Count
   */
  async count() {
    const repository = this.getRepository();
    return await repository.count();
  }
}

module.exports = new RoleRepository();

