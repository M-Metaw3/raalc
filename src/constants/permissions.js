/**
 * Permission Constants
 * 
 * Centralized definition of all system permissions
 * Uses Resource-Action pattern for consistency
 * 
 * Format: RESOURCE.ACTION
 */

const PERMISSIONS = {
  // User Management
  USERS: {
    CREATE: 'users.create',
    READ: 'users.read',
    UPDATE: 'users.update',
    DELETE: 'users.delete',
    LIST: 'users.list',
    ACTIVATE: 'users.activate',
    DEACTIVATE: 'users.deactivate'
  },
  
  // Agent Management
  AGENTS: {
    CREATE: 'agents.create',
    READ: 'agents.read',
    UPDATE: 'agents.update',
    DELETE: 'agents.delete',
    LIST: 'agents.list',
    APPROVE: 'agents.approve',
    REJECT: 'agents.reject',
    ACTIVATE: 'agents.activate',
    FEATURE: 'agents.feature',
    DEACTIVATE: 'agents.deactivate'
  },
  
  // Admin Management
  ADMINS: {
    CREATE: 'admins.create',
    READ: 'admins.read',
    UPDATE: 'admins.update',
    DELETE: 'admins.delete',
    LIST: 'admins.list',
    ACTIVATE: 'admins.activate',
    DEACTIVATE: 'admins.deactivate'
  },
  
  // Role Management
  ROLES: {
    CREATE: 'roles.create',
    READ: 'roles.read',
    UPDATE: 'roles.update',
    DELETE: 'roles.delete',
    LIST: 'roles.list',
    ASSIGN: 'roles.assign',
    REVOKE: 'roles.revoke'
  },
  
  // Permission Management
  PERMISSIONS: {
    CREATE: 'permissions.create',
    READ: 'permissions.read',
    UPDATE: 'permissions.update',
    DELETE: 'permissions.delete',
    LIST: 'permissions.list',
    GRANT: 'permissions.grant',
    REVOKE: 'permissions.revoke'
  },
  
  // Document Management
  DOCUMENTS: {
    READ: 'documents.read',
    APPROVE: 'documents.approve',
    REJECT: 'documents.reject',
    DELETE: 'documents.delete',
    LIST: 'documents.list'
  },
  
  // System Settings
  SETTINGS: {
    READ: 'settings.read',
    UPDATE: 'settings.update'
  },
  
  // Reports & Analytics
  REPORTS: {
    READ: 'reports.read',
    EXPORT: 'reports.export',
    VIEW: 'view_reports'
  },
  
  // Audit Logs
  AUDIT: {
    READ: 'audit.read',
    EXPORT: 'audit.export'
  },
  
  // Shift Management (MVP)
  SHIFTS: {
    VIEW: 'view_shifts',
    CREATE: 'create_shifts',
    UPDATE: 'update_shifts',
    DELETE: 'delete_shifts'
  },
  
  SESSIONS: {
    VIEW: 'view_sessions',
    MANAGE: 'manage_sessions'
  },
  
  BREAKS: {
    VIEW: 'view_breaks',
    MANAGE: 'manage_breaks',
    APPROVE: 'approve_breaks',
    REJECT: 'reject_breaks'
  },
  
  DEPARTMENTS: {
    VIEW: 'view_departments',
    CREATE: 'create_departments',
    UPDATE: 'update_departments',
    DELETE: 'delete_departments'
  }
};

/**
 * Get all permissions as a flat array
 * @returns {Array<string>} Array of all permission names
 */
const getAllPermissions = () => {
  const permissions = [];
  Object.values(PERMISSIONS).forEach(resource => {
    Object.values(resource).forEach(permission => {
      permissions.push(permission);
    });
  });
  return permissions;
};

/**
 * Get permissions by resource
 * @param {string} resource - Resource name (e.g., 'USERS')
 * @returns {Array<string>} Array of permissions for the resource
 */
const getResourcePermissions = (resource) => {
  return Object.values(PERMISSIONS[resource] || {});
};

/**
 * Permission groups for UI organization
 */
const PERMISSION_GROUPS = {
  USER_MANAGEMENT: 'User Management',
  AGENT_MANAGEMENT: 'Agent Management',
  ADMIN_MANAGEMENT: 'Admin Management',
  ROLE_PERMISSION_MANAGEMENT: 'Role & Permission Management',
  DOCUMENT_MANAGEMENT: 'Document Management',
  SYSTEM_MANAGEMENT: 'System Management',
  REPORTING: 'Reporting & Analytics'
};

/**
 * Map permissions to their groups
 */
const PERMISSION_TO_GROUP = {
  'users.*': PERMISSION_GROUPS.USER_MANAGEMENT,
  'agents.*': PERMISSION_GROUPS.AGENT_MANAGEMENT,
  'admins.*': PERMISSION_GROUPS.ADMIN_MANAGEMENT,
  'roles.*': PERMISSION_GROUPS.ROLE_PERMISSION_MANAGEMENT,
  'permissions.*': PERMISSION_GROUPS.ROLE_PERMISSION_MANAGEMENT,
  'documents.*': PERMISSION_GROUPS.DOCUMENT_MANAGEMENT,
  'settings.*': PERMISSION_GROUPS.SYSTEM_MANAGEMENT,
  'reports.*': PERMISSION_GROUPS.REPORTING,
  'audit.*': PERMISSION_GROUPS.REPORTING
};

/**
 * Get permission group
 * @param {string} permission - Permission name
 * @returns {string} Group name
 */
const getPermissionGroup = (permission) => {
  const [resource] = permission.split('.');
  return PERMISSION_TO_GROUP[`${resource}.*`] || 'Other';
};

module.exports = {
  PERMISSIONS,
  PERMISSION_GROUPS,
  getAllPermissions,
  getResourcePermissions,
  getPermissionGroup
};

