const { getRepository } = require('typeorm');
const logger = require('@utils/logger');

/**
 * Roles Seeder
 * 
 * Seeds initial roles into the database
 * Run order: 1
 */

const roles = [
  {
    name: 'Super Admin',
    slug: 'super-admin',
    description: 'Full system access with all permissions',
    isActive: true
  },
  {
    name: 'Admin',
    slug: 'admin',
    description: 'Administrative access with configurable permissions',
    isActive: true
  },
  {
    name: 'Moderator',
    slug: 'moderator',
    description: 'Content moderation and user management',
    isActive: true
  },
  {
    name: 'Content Manager',
    slug: 'content-manager',
    description: 'Manage system content and documents',
    isActive: true
  },
  {
    name: 'Support',
    slug: 'support',
    description: 'Customer support and user assistance',
    isActive: true
  }
];

/**
 * Run seeder
 */
async function run() {
  try {
    const roleRepository = getRepository('Role');

    logger.info('🌱 Seeding roles...');

    for (const roleData of roles) {
      // Check if role already exists
      const existingRole = await roleRepository.findOne({
        where: { slug: roleData.slug }
      });

      if (existingRole) {
        logger.info(`   ⏭️  Role "${roleData.name}" already exists, skipping...`);
        continue;
      }

      // Create role
      const role = roleRepository.create(roleData);
      await roleRepository.save(role);

      logger.info(`   ✅ Role "${roleData.name}" created`);
    }

    logger.info('✅ Roles seeded successfully\n');
  } catch (error) {
    logger.error('❌ Error seeding roles:', error);
    throw error;
  }
}

/**
 * Rollback seeder (for development)
 */
async function rollback() {
  try {
    const roleRepository = getRepository('Role');

    logger.info('🔄 Rolling back roles...');

    for (const roleData of roles) {
      const role = await roleRepository.findOne({
        where: { slug: roleData.slug }
      });

      if (role) {
        await roleRepository.remove(role);
        logger.info(`   ✅ Role "${roleData.name}" removed`);
      }
    }

    logger.info('✅ Roles rollback completed\n');
  } catch (error) {
    logger.error('❌ Error rolling back roles:', error);
    throw error;
  }
}

module.exports = { run, rollback };

