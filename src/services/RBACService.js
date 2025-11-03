const RoleRepository = require('@repositories/RoleRepository');
const PermissionRepository = require('@repositories/PermissionRepository');
const AdminRepository = require('@repositories/AdminRepository');
const { ErrorHandlers } = require('@utils/ErrorHandler');
const logger = require('@utils/logger');

/**
 * RBAC Service
 * 
 * Manages Role-Based Access Control operations
 * Implements business logic for roles and permissions
 * Follows Single Responsibility Principle
 */
class RBACService {
  /**
   * Create a new role
   * @param {Object} roleData - Role data
   * @param {number} createdBy - Admin ID who created
   * @returns {Promise<Object>} Created role
   */
  async createRole(roleData, createdBy) {
    try {
      // Check if role already exists
      const existingRole = await RoleRepository.findByName(roleData.name);
      if (existingRole) {
        throw ErrorHandlers.badRequest('Role already exists');
      }

      // Generate slug from name if not provided
      if (!roleData.slug) {
        roleData.slug = this.generateSlug(roleData.name);
      }

      // Create role
      const role = await RoleRepository.create(roleData);
      
      logger.info(`Role created: ${role.name}`, { roleId: role.id, createdBy });
      
      return role;
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Update role
   * @param {number} roleId - Role ID
   * @param {Object} updateData - Update data
   * @param {number} updatedBy - Admin ID who updated
   * @returns {Promise<Object>} Updated role
   */
  async updateRole(roleId, updateData, updatedBy) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw ErrorHandlers.notFound('Role not found');
      }

      // Check if new name already exists (if changing name)
      if (updateData.name && updateData.name !== role.name) {
        const existingRole = await RoleRepository.findByName(updateData.name);
        if (existingRole) {
          throw ErrorHandlers.badRequest('Role name already exists');
        }
      }

      // Update slug if name changed
      if (updateData.name && !updateData.slug) {
        updateData.slug = this.generateSlug(updateData.name);
      }

      const updatedRole = await RoleRepository.update(roleId, updateData);
      
      logger.info(`Role updated: ${updatedRole.name}`, { roleId, updatedBy });
      
      return updatedRole;
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   * @param {number} roleId - Role ID
   * @param {number} deletedBy - Admin ID who deleted
   * @returns {Promise<boolean>} Success status
   */
  async deleteRole(roleId, deletedBy) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw ErrorHandlers.notFound('Role not found');
      }

      // Check if role is Super Admin
      if (role.name === 'Super Admin' || role.slug === 'super-admin') {
        throw ErrorHandlers.forbidden('Cannot delete Super Admin role');
      }

      const success = await RoleRepository.delete(roleId);
      
      logger.info(`Role deleted: ${role.name}`, { roleId, deletedBy });
      
      return success;
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   * @param {boolean} activeOnly - Return only active roles
   * @returns {Promise<Array>} Array of roles
   */
  async getAllRoles(activeOnly = false) {
    try {
      return await RoleRepository.findAll(activeOnly);
    } catch (error) {
      logger.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Get role by ID with permissions
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} Role with permissions
   */
  async getRoleWithPermissions(roleId) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw ErrorHandlers.notFound('Role not found');
      }

      const permissions = await RoleRepository.getPermissions(roleId);
      
      return {
        ...role,
        permissions
      };
    } catch (error) {
      logger.error('Error getting role with permissions:', error);
      throw error;
    }
  }

  /**
   * Assign permissions to role
   * @param {number} roleId - Role ID
   * @param {Array<number>} permissionIds - Permission IDs
   * @param {number} grantedBy - Admin ID who granted
   * @returns {Promise<Object>} Updated role with permissions
   */
  async assignPermissionsToRole(roleId, permissionIds, grantedBy) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw ErrorHandlers.notFound('Role not found');
      }

      // Validate permissions exist
      const permissions = await Promise.all(
        permissionIds.map(id => PermissionRepository.findById(id))
      );
      
      const invalidPermissions = permissions.filter(p => !p);
      if (invalidPermissions.length > 0) {
        throw ErrorHandlers.badRequest('Some permissions do not exist');
      }

      // Remove existing permissions
      await RoleRepository.removePermissions(roleId);
      
      // Assign new permissions
      await RoleRepository.assignPermissions(roleId, permissionIds, grantedBy);
      
      logger.info(`Permissions assigned to role: ${role.name}`, {
        roleId,
        permissionCount: permissionIds.length,
        grantedBy
      });
      
      return await this.getRoleWithPermissions(roleId);
    } catch (error) {
      logger.error('Error assigning permissions to role:', error);
      throw error;
    }
  }

  /**
   * Remove a specific permission from role
   * @param {number} roleId - Role ID
   * @param {number} permissionId - Permission ID to remove
   * @param {number} removedBy - Admin ID who removed
   * @returns {Promise<Object>} Updated role with permissions
   */
  async removePermissionFromRole(roleId, permissionId, removedBy) {
    try {
      const role = await RoleRepository.findById(roleId);
      if (!role) {
        throw ErrorHandlers.notFound('Role not found');
      }

      // Check if permission exists
      const permission = await PermissionRepository.findById(permissionId);
      if (!permission) {
        throw ErrorHandlers.notFound('Permission not found');
      }

      // Check if role has this permission
      const rolePermissions = await RoleRepository.getPermissions(roleId);
      const hasPermission = rolePermissions.some(p => p.id === permissionId);
      
      if (!hasPermission) {
        throw ErrorHandlers.notFound('Role does not have this permission');
      }

      // Remove the specific permission
      await RoleRepository.removePermissions(roleId, [permissionId]);
      
      logger.info(`Permission removed from role: ${role.name}`, {
        roleId,
        permissionId,
        permissionName: permission.name,
        removedBy
      });
      
      return await this.getRoleWithPermissions(roleId);
    } catch (error) {
      logger.error('Error removing permission from role:', error);
      throw error;
    }
  }

  /**
   * Create a new permission
   * @param {Object} permissionData - Permission data
   * @param {number} createdBy - Admin ID who created
   * @returns {Promise<Object>} Created permission
   */
  async createPermission(permissionData, createdBy) {
    try {
      // Check if permission already exists
      const existingPermission = await PermissionRepository.findByName(permissionData.name);
      if (existingPermission) {
        throw ErrorHandlers.badRequest('Permission already exists');
      }

      const permission = await PermissionRepository.create(permissionData);
      
      logger.info(`Permission created: ${permission.name}`, {
        permissionId: permission.id,
        createdBy
      });
      
      return permission;
    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Get all permissions grouped by resource or group
   * @param {string} groupBy - 'resource' or 'group'
   * @returns {Promise<Object>} Grouped permissions
   */
  async getAllPermissionsGrouped(groupBy = 'group') {
    try {
      if (groupBy === 'resource') {
        return await PermissionRepository.findAllGroupedByResource();
      }
      return await PermissionRepository.findAllGroupedByGroup();
    } catch (error) {
      logger.error('Error getting grouped permissions:', error);
      throw error;
    }
  }

  /**
   * Assign roles to admin
   * @param {number} adminId - Admin ID
   * @param {Array<number>} roleIds - Role IDs
   * @param {number} assignedBy - Admin ID who assigned
   * @returns {Promise<Object>} Admin with roles
   */
  async assignRolesToAdmin(adminId, roleIds, assignedBy) {
    try {
      const admin = await AdminRepository.findById(adminId);
      if (!admin) {
        throw ErrorHandlers.notFound('Admin not found');
      }

      // Validate roles exist
      const roles = await Promise.all(
        roleIds.map(id => RoleRepository.findById(id))
      );
      
      const invalidRoles = roles.filter(r => !r);
      if (invalidRoles.length > 0) {
        throw ErrorHandlers.badRequest('Some roles do not exist');
      }

      // Sync roles (replace all existing)
      await AdminRepository.syncRoles(adminId, roleIds, assignedBy);
      
      logger.info(`Roles assigned to admin: ${admin.email}`, {
        adminId,
        roleCount: roleIds.length,
        assignedBy
      });
      
      // Return admin with roles
      const adminRoles = await AdminRepository.getRoles(adminId);
      
      return {
        ...admin,
        roles: adminRoles
      };
    } catch (error) {
      logger.error('Error assigning roles to admin:', error);
      throw error;
    }
  }

  /**
   * Check if admin has permission
   * @param {number} adminId - Admin ID
   * @param {string} permissionName - Permission name
   * @returns {Promise<boolean>} Has permission
   */
  async checkAdminPermission(adminId, permissionName) {
    try {
      return await AdminRepository.hasPermission(adminId, permissionName);
    } catch (error) {
      logger.error('Error checking admin permission:', error);
      return false;
    }
  }

  /**
   * Check if admin has any of the permissions
   * @param {number} adminId - Admin ID
   * @param {Array<string>} permissionNames - Permission names
   * @returns {Promise<boolean>} Has any permission
   */
  async checkAdminAnyPermission(adminId, permissionNames) {
    try {
      return await AdminRepository.hasAnyPermission(adminId, permissionNames);
    } catch (error) {
      logger.error('Error checking admin permissions:', error);
      return false;
    }
  }

  /**
   * Get admin permissions (cached in memory for performance)
   * @param {number} adminId - Admin ID
   * @returns {Promise<Array>} Array of permission names
   */
  async getAdminPermissions(adminId) {
    try {
      const permissions = await AdminRepository.getPermissions(adminId);
      return permissions.map(p => p.name);
    } catch (error) {
      logger.error('Error getting admin permissions:', error);
      return [];
    }
  }

  /**
   * Generate URL-friendly slug from name
   * @param {string} name - Name to convert
   * @returns {string} Slug
   * @private
   */
  generateSlug(name) {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/--+/g, '-')
      .trim();
  }
}

module.exports = new RBACService();

