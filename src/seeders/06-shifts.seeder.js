const { getConnection } = require('typeorm');
const logger = require('@utils/logger');

/**
 * Shifts Seeder
 * 
 * Seeds default shifts
 */

const shifts = [
  {
    name: 'Morning',
    nameAr: 'صباحي',
    startTime: '00:00:00',
    endTime: '23:59:00',
    gracePeriod: 1440, // 24 hours - for testing
    allowOvertime: false,
    overtimeRequiresApproval: true,
    maxOvertimeMinutes: 120,
    assignmentType: 'all',
    departmentId: null,
    isActive: true
  },
  {
    name: 'Evening',
    nameAr: 'مسائي',
    startTime: '14:00:00',
    endTime: '22:00:00',
    gracePeriod: 15,
    allowOvertime: false,
    overtimeRequiresApproval: true,
    maxOvertimeMinutes: 60,
    assignmentType: 'all',
    departmentId: null,
    isActive: true
  },
  {
    name: 'Remote',
    nameAr: 'من المنزل',
    startTime: '09:00:00',
    endTime: '17:00:00',
    gracePeriod: 15,
    allowOvertime: true,
    overtimeRequiresApproval: false,
    maxOvertimeMinutes: 120,
    assignmentType: 'all',
    departmentId: null,
    isActive: true
  },
  {
    name: 'Full Day',
    nameAr: 'يوم كامل',
    startTime: '09:00:00',
    endTime: '18:00:00',
    gracePeriod: 10,
    allowOvertime: false,
    overtimeRequiresApproval: true,
    maxOvertimeMinutes: 60,
    assignmentType: 'all',
    departmentId: null,
    isActive: true
  }
];

async function seed() {
  try {
    const connection = getConnection();
    const repository = connection.getRepository('Shift');

    logger.info('🌱 Seeding shifts...');

    let created = 0;
    let skipped = 0;

    for (const shift of shifts) {
      const existing = await repository.findOne({ where: { name: shift.name } });
      
      if (existing) {
        logger.info(`   ⏭️  Shift "${shift.name}" already exists, skipping...`);
        skipped++;
        continue;
      }

      const newShift = await repository.save(shift);
      logger.info(`   ✅ Created shift: ${shift.name} (${shift.nameAr}) [${shift.startTime}-${shift.endTime}]`);
      created++;
    }

    logger.info(`✅ Shifts seeded successfully`);
    logger.info(`   ✅ Created: ${created}`);
    logger.info(`   ⏭️  Skipped: ${skipped}`);
    logger.info(' ');

    return { created, skipped };
  } catch (error) {
    logger.error('❌ Error seeding shifts:', error);
    throw error;
  }
}

async function rollback() {
  try {
    const connection = getConnection();
    const repository = connection.getRepository('Shift');

    logger.info('🗑️  Rolling back shifts...');

    const shiftNames = shifts.map(s => s.name);
    await repository
      .createQueryBuilder()
      .delete()
      .where('name IN (:...names)', { names: shiftNames })
      .execute();

    logger.info('✅ Shifts rollback completed');
    logger.info(' ');
  } catch (error) {
    logger.error('❌ Error rolling back shifts:', error);
    throw error;
  }
}

module.exports = { seed, rollback };


