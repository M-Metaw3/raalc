const { getRepository } = require('typeorm');

/**
 * Admin Repository
 * 
 * Handles database operations for admins with RBAC support
 * Implements Repository Pattern for data abstraction
 */
class AdminRepository {
  /**
   * Get TypeORM repository
   * @private
   */
  getRepository() {
    return getRepository('Admin');
  }

  /**
   * Create a new admin
   * @param {Object} adminData - Admin data
   * @returns {Promise<Object>} Created admin
   */
  async create(adminData) {
    const repository = this.getRepository();
    const admin = repository.create(adminData);
    return await repository.save(admin);
  }

  /**
   * Find admin by ID
   * @param {number} id - Admin ID
   * @param {boolean} includePassword - Include password field
   * @returns {Promise<Object|null>} Admin or null
   */
  async findById(id, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('admin')
      .where('admin.id = :id', { id })
      .andWhere('admin.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('admin.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find admin by email
   * @param {string} email - Admin email
   * @param {boolean} includePassword - Include password field
   * @returns {Promise<Object|null>} Admin or null
   */
  async findByEmail(email, includePassword = false) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('admin')
      .where('admin.email = :email', { email })
      .andWhere('admin.deletedAt IS NULL');
    
    if (includePassword) {
      query.addSelect('admin.password');
    }
    
    return await query.getOne();
  }

  /**
   * Find admin with roles and permissions
   * @param {number} id - Admin ID
   * @returns {Promise<Object|null>} Admin with roles and permissions
   */
  async findWithRolesAndPermissions(id) {
    const repository = this.getRepository();
    
    return await repository
      .createQueryBuilder('admin')
      .leftJoinAndSelect('AdminRole', 'ar', 'ar.adminId = admin.id')
      .leftJoinAndSelect('Role', 'role', 'role.id = ar.roleId AND role.isActive = 1')
      .leftJoinAndSelect('RolePermission', 'rp', 'rp.roleId = role.id')
      .leftJoinAndSelect('Permission', 'permission', 'permission.id = rp.permissionId AND permission.isActive = 1')
      .where('admin.id = :id', { id })
      .andWhere('admin.deletedAt IS NULL')
      .getOne();
  }

  /**
   * Get admin roles
   * @param {number} adminId - Admin ID
   * @returns {Promise<Array>} Array of roles
   */
  async getRoles(adminId) {
    const roleRepo = getRepository('Role');
    
    return await roleRepo
      .createQueryBuilder('role')
      .innerJoin('AdminRole', 'ar', 'ar.roleId = role.id')
      .where('ar.adminId = :adminId', { adminId })
      .andWhere('role.isActive = :isActive', { isActive: true })
      .orderBy('role.name', 'ASC')
      .getMany();
  }

  /**
   * Get admin permissions (aggregated from all roles)
   * @param {number} adminId - Admin ID
   * @returns {Promise<Array>} Array of unique permissions
   */
  async getPermissions(adminId) {
    const permissionRepo = getRepository('Permission');
    
    return await permissionRepo
      .createQueryBuilder('permission')
      .innerJoin('RolePermission', 'rp', 'rp.permissionId = permission.id')
      .innerJoin('Role', 'role', 'role.id = rp.roleId AND role.isActive = 1')
      .innerJoin('AdminRole', 'ar', 'ar.roleId = role.id')
      .where('ar.adminId = :adminId', { adminId })
      .andWhere('permission.isActive = :isActive', { isActive: true })
      .groupBy('permission.id')
      .orderBy('permission.resource', 'ASC')
      .addOrderBy('permission.action', 'ASC')
      .getMany();
  }

  /**
   * Assign roles to admin
   * @param {number} adminId - Admin ID
   * @param {Array<number>} roleIds - Role IDs
   * @param {number} assignedBy - Admin ID who assigned
   * @returns {Promise<boolean>} Success status
   */
  async assignRoles(adminId, roleIds, assignedBy = null) {
    const adminRoleRepo = getRepository('AdminRole');
    
    const adminRoles = roleIds.map(roleId => ({
      adminId,
      roleId,
      assignedBy,
      assignedAt: new Date()
    }));
    
    await adminRoleRepo.insert(adminRoles);
    return true;
  }

  /**
   * Remove roles from admin
   * @param {number} adminId - Admin ID
   * @param {Array<number>} roleIds - Role IDs (optional, if not provided removes all)
   * @returns {Promise<boolean>} Success status
   */
  async removeRoles(adminId, roleIds = null) {
    const adminRoleRepo = getRepository('AdminRole');
    
    const where = { adminId };
    if (roleIds && roleIds.length > 0) {
      where.roleId = roleIds;
    }
    
    const result = await adminRoleRepo.delete(where);
    return result.affected > 0;
  }

  /**
   * Sync admin roles (replace all roles)
   * @param {number} adminId - Admin ID
   * @param {Array<number>} roleIds - Role IDs
   * @param {number} assignedBy - Admin ID who assigned
   * @returns {Promise<boolean>} Success status
   */
  async syncRoles(adminId, roleIds, assignedBy = null) {
    // Remove all existing roles
    await this.removeRoles(adminId);
    
    // Assign new roles
    if (roleIds && roleIds.length > 0) {
      await this.assignRoles(adminId, roleIds, assignedBy);
    }
    
    return true;
  }

  /**
   * Check if admin has permission
   * @param {number} adminId - Admin ID
   * @param {string} permissionName - Permission name
   * @returns {Promise<boolean>} Has permission
   */
  async hasPermission(adminId, permissionName) {
    const permissions = await this.getPermissions(adminId);
    return permissions.some(p => p.name === permissionName);
  }

  /**
   * Check if admin has any of the permissions
   * @param {number} adminId - Admin ID
   * @param {Array<string>} permissionNames - Permission names
   * @returns {Promise<boolean>} Has any permission
   */
  async hasAnyPermission(adminId, permissionNames) {
    const permissions = await this.getPermissions(adminId);
    const permissionNameSet = new Set(permissions.map(p => p.name));
    return permissionNames.some(name => permissionNameSet.has(name));
  }

  /**
   * Check if admin has role
   * @param {number} adminId - Admin ID
   * @param {string} roleName - Role name
   * @returns {Promise<boolean>} Has role
   */
  async hasRole(adminId, roleName) {
    const roles = await this.getRoles(adminId);
    return roles.some(r => r.name === roleName);
  }

  /**
   * Update admin
   * @param {number} id - Admin ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated admin
   */
  async update(id, updateData) {
    const repository = this.getRepository();
    await repository.update(id, updateData);
    return await this.findById(id);
  }

  /**
   * Soft delete admin
   * @param {number} id - Admin ID
   * @returns {Promise<boolean>} Success status
   */
  async softDelete(id) {
    const repository = this.getRepository();
    const result = await repository.update(id, { deletedAt: new Date() });
    return result.affected > 0;
  }

  /**
   * Get all admins
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Array of admins
   */
  async findAll(filters = {}) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('admin')
      .where('admin.deletedAt IS NULL');
    
    if (filters.isActive !== undefined) {
      query.andWhere('admin.isActive = :isActive', { isActive: filters.isActive });
    }
    
    if (filters.search) {
      query.andWhere(
        '(admin.firstName LIKE :search OR admin.lastName LIKE :search OR admin.email LIKE :search)',
        { search: `%${filters.search}%` }
      );
    }
    
    query.orderBy('admin.createdAt', 'DESC');
    
    return await query.getMany();
  }

  /**
   * Count admins
   * @param {Object} filters - Filter options
   * @returns {Promise<number>} Count
   */
  async count(filters = {}) {
    const repository = this.getRepository();
    const query = repository.createQueryBuilder('admin')
      .where('admin.deletedAt IS NULL');
    
    if (filters.isActive !== undefined) {
      query.andWhere('admin.isActive = :isActive', { isActive: filters.isActive });
    }
    
    return await query.getCount();
  }
}

module.exports = new AdminRepository();
