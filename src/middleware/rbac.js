const { ErrorHandlers } = require('@utils/ErrorHandler');
const AdminRepository = require('@repositories/AdminRepository');
const logger = require('@utils/logger');

/**
 * RBAC Middleware
 * 
 * Provides authorization middleware for role and permission checking
 * Implements Chain of Responsibility pattern
 */

/**
 * Check if admin has required permission
 * @param {string|Array<string>} requiredPermissions - Required permission(s)
 * @returns {Function} Express middleware
 */
const requirePermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw ErrorHandlers.forbidden('auth.accessDenied');
      }

      const adminId = req.user.id;

      // Convert to array if single permission
      const permissions = Array.isArray(requiredPermissions) 
        ? requiredPermissions 
        : [requiredPermissions];

      // Get admin permissions from database
      const adminPermissions = await AdminRepository.getPermissions(adminId);
      const adminPermissionNames = adminPermissions.map(p => p.name);

      // Check if admin has all required permissions
      const hasAllPermissions = permissions.every(permission => 
        adminPermissionNames.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn(`Permission denied for admin ${req.user.email}`, {
          adminId,
          requiredPermissions: permissions,
          hasPermissions: adminPermissionNames
        });
        
        throw ErrorHandlers.forbidden('auth.insufficientPermissions');
      }

      // Attach permissions to request for future use
      req.permissions = adminPermissionNames;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin has any of the required permissions
 * @param {Array<string>} requiredPermissions - Required permissions
 * @returns {Function} Express middleware
 */
const requireAnyPermission = (requiredPermissions) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw ErrorHandlers.forbidden('auth.accessDenied');
      }

      const adminId = req.user.id;

      // Get admin permissions from database
      const adminPermissions = await AdminRepository.getPermissions(adminId);
      const adminPermissionNames = adminPermissions.map(p => p.name);

      // Check if admin has any of the required permissions
      const hasAnyPermission = requiredPermissions.some(permission => 
        adminPermissionNames.includes(permission)
      );

      if (!hasAnyPermission) {
        logger.warn(`Permission denied for admin ${req.user.email}`, {
          adminId,
          requiredPermissions,
          hasPermissions: adminPermissionNames
        });
        
        throw ErrorHandlers.forbidden('auth.insufficientPermissions');
      }

      // Attach permissions to request for future use
      req.permissions = adminPermissionNames;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin has required role
 * @param {string|Array<string>} requiredRoles - Required role(s)
 * @returns {Function} Express middleware
 */
const requireRole = (requiredRoles) => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw ErrorHandlers.forbidden('auth.accessDenied');
      }

      const adminId = req.user.id;

      // Convert to array if single role
      const roles = Array.isArray(requiredRoles) 
        ? requiredRoles 
        : [requiredRoles];

      // Get admin roles from database
      const adminRoles = await AdminRepository.getRoles(adminId);
      const adminRoleNames = adminRoles.map(r => r.name);

      // Check if admin has any of the required roles
      const hasRequiredRole = roles.some(role => 
        adminRoleNames.includes(role)
      );

      if (!hasRequiredRole) {
        logger.warn(`Role denied for admin ${req.user.email}`, {
          adminId,
          requiredRoles: roles,
          hasRoles: adminRoleNames
        });
        
        throw ErrorHandlers.forbidden('auth.insufficientRole');
      }

      // Attach roles to request for future use
      req.roles = adminRoleNames;

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin is Super Admin
 * @returns {Function} Express middleware
 */
const requireSuperAdmin = () => {
  return requireRole('Super Admin');
};

/**
 * Check if admin can manage permissions
 * Super Admin or Admin with 'permissions.grant' permission
 * @returns {Function} Express middleware
 */
const canManagePermissions = () => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw ErrorHandlers.forbidden('auth.accessDenied');
      }

      const adminId = req.user.id;

      // Check if Super Admin
      const roles = await AdminRepository.getRoles(adminId);
      const isSuperAdmin = roles.some(r => r.name === 'Super Admin');

      if (isSuperAdmin) {
        req.isSuperAdmin = true;
        return next();
      }

      // Check if has permission
      const hasPermission = await AdminRepository.hasPermission(
        adminId,
        'permissions.grant'
      );

      if (!hasPermission) {
        throw ErrorHandlers.forbidden('auth.insufficientPermissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if admin can manage roles
 * Super Admin or Admin with 'roles.assign' permission
 * @returns {Function} Express middleware
 */
const canManageRoles = () => {
  return async (req, res, next) => {
    try {
      // Ensure user is authenticated
      if (!req.user || req.user.userType !== 'ADMIN') {
        throw ErrorHandlers.forbidden('auth.accessDenied');
      }

      const adminId = req.user.id;

      // Check if Super Admin
      const roles = await AdminRepository.getRoles(adminId);
      const isSuperAdmin = roles.some(r => r.name === 'Super Admin');

      if (isSuperAdmin) {
        req.isSuperAdmin = true;
        return next();
      }

      // Check if has permission
      const hasPermission = await AdminRepository.hasPermission(
        adminId,
        'roles.assign'
      );

      if (!hasPermission) {
        throw ErrorHandlers.forbidden('auth.insufficientPermissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Attach admin permissions to request (no authorization check)
 * Useful for conditional UI rendering
 * @returns {Function} Express middleware
 */
const attachPermissions = () => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.userType === 'ADMIN') {
        const permissions = await AdminRepository.getPermissions(req.user.id);
        req.permissions = permissions.map(p => p.name);
        
        const roles = await AdminRepository.getRoles(req.user.id);
        req.roles = roles.map(r => r.name);
      }
      next();
    } catch (error) {
      // Don't fail the request, just log the error
      logger.error('Error attaching permissions:', error);
      next();
    }
  };
};

module.exports = {
  requirePermission,
  requireAnyPermission,
  requireRole,
  requireSuperAdmin,
  canManagePermissions,
  canManageRoles,
  attachPermissions
};

