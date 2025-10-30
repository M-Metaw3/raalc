const { getRepository } = require('typeorm');
const bcrypt = require('bcryptjs');
const logger = require('@utils/logger');

/**
 * Super Admin Seeder
 * 
 * Creates initial Super Admin account
 * Run order: 4
 */

/**
 * Super Admin credentials (should be changed after first login)
 */
const superAdminData = {
  firstName: 'Super',
  lastName: 'Admin',
  email: process.env.SUPER_ADMIN_EMAIL || 'superadmin@raalc.com',
  password: process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!',
  phone: process.env.SUPER_ADMIN_PHONE || null,
  isActive: true
};

/**
 * Run seeder
 */
async function run() {
  try {
    const adminRepository = getRepository('Admin');
    const roleRepository = getRepository('Role');
    const adminRoleRepository = getRepository('AdminRole');

    logger.info('🌱 Seeding Super Admin...');

    // Check if Super Admin already exists
    const existingAdmin = await adminRepository.findOne({
      where: { email: superAdminData.email }
    });

    if (existingAdmin) {
      logger.info('   ⏭️  Super Admin already exists, skipping...');
      logger.info('✅ Super Admin seeder completed\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(superAdminData.password, 12);

    // Create Super Admin
    const admin = adminRepository.create({
      ...superAdminData,
      password: hashedPassword,
      createdBy: null // Created by system
    });

    const savedAdmin = await adminRepository.save(admin);

    logger.info(`   ✅ Super Admin created: ${savedAdmin.email}`);

    // Assign Super Admin role
    const superAdminRole = await roleRepository.findOne({
      where: { slug: 'super-admin' }
    });

    if (!superAdminRole) {
      logger.error('   ❌ Super Admin role not found!');
      throw new Error('Super Admin role not found. Please run roles seeder first.');
    }

    // Create admin-role assignment
    const adminRole = adminRoleRepository.create({
      adminId: savedAdmin.id,
      roleId: superAdminRole.id,
      assignedBy: null, // Assigned by system
      assignedAt: new Date()
    });

    await adminRoleRepository.save(adminRole);

    logger.info('   ✅ Super Admin role assigned');
    logger.info('');
    logger.info('📧 Super Admin Credentials:');
    logger.info(`   Email: ${superAdminData.email}`);
    logger.info(`   Password: ${superAdminData.password}`);
    logger.info('');
    logger.warn('⚠️  IMPORTANT: Change the password after first login!');
    logger.info('✅ Super Admin seeder completed\n');
  } catch (error) {
    logger.error('❌ Error seeding Super Admin:', error);
    throw error;
  }
}

/**
 * Rollback seeder (for development)
 */
async function rollback() {
  try {
    const adminRepository = getRepository('Admin');

    logger.info('🔄 Rolling back Super Admin...');

    const admin = await adminRepository.findOne({
      where: { email: superAdminData.email }
    });

    if (admin) {
      await adminRepository.remove(admin);
      logger.info('   ✅ Super Admin removed');
    }

    logger.info('✅ Super Admin rollback completed\n');
  } catch (error) {
    logger.error('❌ Error rolling back Super Admin:', error);
    throw error;
  }
}

module.exports = { run, rollback };


