const { getConnection } = require('typeorm');
const logger = require('@utils/logger');

/**
 * Departments Seeder
 * 
 * Seeds default departments
 */

const departments = [
  {
    name: 'Family',
    nameAr: 'أسرة',
    description: 'Family law department',
    isActive: true
  },
  {
    name: 'Work',
    nameAr: 'عمل',
    description: 'Work and labor law department',
    isActive: true
  },
  {
    name: 'Inheritance',
    nameAr: 'ميراث',
    description: 'Inheritance law department',
    isActive: true
  },
  {
    name: 'Real Estate',
    nameAr: 'عقارات',
    description: 'Real estate law department',
    isActive: true
  },
  {
    name: 'Commercial',
    nameAr: 'تجاري',
    description: 'Commercial law department',
    isActive: true
  }
];

async function seed() {
  try {
    const connection = getConnection();
    const repository = connection.getRepository('Department');

    logger.info('🌱 Seeding departments...');

    let created = 0;
    let skipped = 0;

    for (const dept of departments) {
      const existing = await repository.findOne({ where: { name: dept.name } });
      
      if (existing) {
        logger.info(`   ⏭️  Department "${dept.name}" already exists, skipping...`);
        skipped++;
        continue;
      }

      await repository.save(dept);
      logger.info(`   ✅ Created department: ${dept.name} (${dept.nameAr})`);
      created++;
    }

    logger.info(`✅ Departments seeded successfully`);
    logger.info(`   ✅ Created: ${created}`);
    logger.info(`   ⏭️  Skipped: ${skipped}`);
    logger.info(' ');

    return { created, skipped };
  } catch (error) {
    logger.error('❌ Error seeding departments:', error);
    throw error;
  }
}

async function rollback() {
  try {
    const connection = getConnection();
    const repository = connection.getRepository('Department');

    logger.info('🗑️  Rolling back departments...');

    const departmentNames = departments.map(d => d.name);
    await repository
      .createQueryBuilder()
      .delete()
      .where('name IN (:...names)', { names: departmentNames })
      .execute();

    logger.info('✅ Departments rollback completed');
    logger.info(' ');
  } catch (error) {
    logger.error('❌ Error rolling back departments:', error);
    throw error;
  }
}

module.exports = { seed, rollback };













