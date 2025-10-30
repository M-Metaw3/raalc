const { getRepository } = require('typeorm');
const logger = require('@utils/logger');
const { getAllPermissions, getPermissionGroup } = require('@constants/permissions');

/**
 * Permissions Seeder
 * 
 * Seeds all system permissions from constants
 * Run order: 2
 */

/**
 * Generate permission objects from constants
 */
function generatePermissions() {
  const allPermissions = getAllPermissions();
  
  return allPermissions.map(permissionName => {
    // Handle both formats: 'resource.action' and 'action_resource'
    let resource, action;
    
    if (permissionName.includes('.')) {
      [resource, action] = permissionName.split('.');
    } else if (permissionName.includes('_')) {
      [action, resource] = permissionName.split('_');
    } else {
      // Fallback: use permission name as both resource and action
      resource = permissionName;
      action = 'access';
    }
    
    const group = getPermissionGroup(permissionName);

    return {
      name: permissionName,
      resource: resource || 'general',
      action: action || 'access',
      group,
      description: `${action.charAt(0).toUpperCase() + action.slice(1)} ${resource}`,
      isActive: true
    };
  });
}

/**
 * Run seeder
 */
async function run() {
  try {
    const permissionRepository = getRepository('Permission');
    const permissions = generatePermissions();

    logger.info('🌱 Seeding permissions...');

    let created = 0;
    let skipped = 0;

    for (const permissionData of permissions) {
      // Check if permission already exists
      const existingPermission = await permissionRepository.findOne({
        where: { name: permissionData.name }
      });

      if (existingPermission) {
        skipped++;
        continue;
      }

      // Create permission
      const permission = permissionRepository.create(permissionData);
      await permissionRepository.save(permission);
      created++;
    }

    logger.info(`   ✅ Created ${created} permissions`);
    logger.info(`   ⏭️  Skipped ${skipped} existing permissions`);
    logger.info('✅ Permissions seeded successfully\n');
  } catch (error) {
    logger.error('❌ Error seeding permissions:', error);
    throw error;
  }
}

/**
 * Rollback seeder (for development)
 */
async function rollback() {
  try {
    const permissionRepository = getRepository('Permission');
    const permissions = generatePermissions();

    logger.info('🔄 Rolling back permissions...');

    let removed = 0;

    for (const permissionData of permissions) {
      const permission = await permissionRepository.findOne({
        where: { name: permissionData.name }
      });

      if (permission) {
        await permissionRepository.remove(permission);
        removed++;
      }
    }

    logger.info(`   ✅ Removed ${removed} permissions`);
    logger.info('✅ Permissions rollback completed\n');
  } catch (error) {
    logger.error('❌ Error rolling back permissions:', error);
    throw error;
  }
}

module.exports = { run, rollback };

