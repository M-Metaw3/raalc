const { getRepository } = require('typeorm');
const logger = require('@utils/logger');
const { getAllPermissions } = require('@constants/permissions');

/**
 * Role-Permissions Seeder
 * 
 * Assigns permissions to roles
 * Run order: 3
 */

/**
 * Define role-permission mappings
 */
const rolePermissionMappings = {
  'Super Admin': getAllPermissions(), // All permissions
  
  'Admin': [
    // User Management
    'users.read', 'users.list', 'users.update', 
    'users.activate', 'users.deactivate',
    
    // Agent Management
    'agents.read', 'agents.list', 'agents.update',
    'agents.approve', 'agents.reject',
    'agents.activate', 'agents.deactivate',
    
    // Document Management
    'documents.read', 'documents.list',
    'documents.approve', 'documents.reject',
    
    // Reports
    'reports.read'
  ],
  
  'Moderator': [
    // User Management (limited)
    'users.read', 'users.list',
    
    // Agent Management (limited)
    'agents.read', 'agents.list',
    
    // Document Management
    'documents.read', 'documents.list',
    'documents.approve', 'documents.reject'
  ],
  
  'Content Manager': [
    // Document Management
    'documents.read', 'documents.list',
    'documents.approve', 'documents.reject',
    'documents.delete',
    
    // Settings
    'settings.read', 'settings.update'
  ],
  
  'Support': [
    // User Management (read only)
    'users.read', 'users.list',
    
    // Agent Management (read only)
    'agents.read', 'agents.list',
    
    // Document Management (read only)
    'documents.read', 'documents.list'
  ]
};

/**
 * Run seeder
 */
async function run() {
  try {
    const roleRepository = getRepository('Role');
    const permissionRepository = getRepository('Permission');
    const rolePermissionRepository = getRepository('RolePermission');

    logger.info('🌱 Seeding role-permissions...');

    for (const [roleName, permissionNames] of Object.entries(rolePermissionMappings)) {
      // Find role
      const role = await roleRepository.findOne({
        where: { name: roleName }
      });

      if (!role) {
        logger.warn(`   ⚠️  Role "${roleName}" not found, skipping...`);
        continue;
      }

      let assigned = 0;
      let skipped = 0;

      for (const permissionName of permissionNames) {
        // Find permission
        const permission = await permissionRepository.findOne({
          where: { name: permissionName }
        });

        if (!permission) {
          logger.warn(`   ⚠️  Permission "${permissionName}" not found, skipping...`);
          continue;
        }

        // Check if already assigned
        const existing = await rolePermissionRepository.findOne({
          where: {
            roleId: role.id,
            permissionId: permission.id
          }
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Create role-permission assignment
        const rolePermission = rolePermissionRepository.create({
          roleId: role.id,
          permissionId: permission.id,
          grantedBy: null, // Seeded by system
          grantedAt: new Date()
        });

        await rolePermissionRepository.save(rolePermission);
        assigned++;
      }

      logger.info(`   ✅ Role "${roleName}": ${assigned} permissions assigned, ${skipped} skipped`);
    }

    logger.info('✅ Role-permissions seeded successfully\n');
  } catch (error) {
    logger.error('❌ Error seeding role-permissions:', error);
    throw error;
  }
}

/**
 * Rollback seeder (for development)
 */
async function rollback() {
  try {
    const rolePermissionRepository = getRepository('RolePermission');

    logger.info('🔄 Rolling back role-permissions...');

    // Delete all role-permission assignments
    await rolePermissionRepository.clear();

    logger.info('✅ Role-permissions rollback completed\n');
  } catch (error) {
    logger.error('❌ Error rolling back role-permissions:', error);
    throw error;
  }
}

module.exports = { run, rollback };

