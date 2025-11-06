const { getConnection } = require('typeorm');
const logger = require('@utils/logger');

/**
 * Break Policies Seeder
 * 
 * Seeds default break policies for each shift
 */

// Break policies will be created for shifts by name
const breakPolicies = [
  {
    shiftName: 'Morning',
    maxBreaksPerDay: 2,
    minDuration: 10,
    maxDuration: 30,
    autoApproveLimit: 15,
    cooldownMinutes: 90,
    preferredStartTime: '12:00:00',
    preferredEndTime: '14:00:00',
    blockDuringMeetings: false,
    meetingBufferMinutes: 10,
    allowedBreakTypes: ['short', 'lunch', 'emergency']
  },
  {
    shiftName: 'Evening',
    maxBreaksPerDay: 2,
    minDuration: 10,
    maxDuration: 30,
    autoApproveLimit: 15,
    cooldownMinutes: 90,
    preferredStartTime: '16:00:00',
    preferredEndTime: '18:00:00',
    blockDuringMeetings: false,
    meetingBufferMinutes: 10,
    allowedBreakTypes: ['short', 'lunch', 'emergency']
  },
  {
    shiftName: 'Remote',
    maxBreaksPerDay: 1,
    minDuration: 15,
    maxDuration: 30,
    autoApproveLimit: 30,
    cooldownMinutes: 120,
    preferredStartTime: null,
    preferredEndTime: null,
    blockDuringMeetings: false,
    meetingBufferMinutes: 15,
    allowedBreakTypes: ['lunch', 'emergency']
  },
  {
    shiftName: 'Full Day',
    maxBreaksPerDay: 3,
    minDuration: 10,
    maxDuration: 45,
    autoApproveLimit: 20,
    cooldownMinutes: 90,
    preferredStartTime: '12:00:00',
    preferredEndTime: '15:00:00',
    blockDuringMeetings: false,
    meetingBufferMinutes: 10,
    allowedBreakTypes: ['short', 'lunch', 'emergency']
  }
];

async function seed() {
  try {
    const connection = getConnection();
    const shiftRepository = connection.getRepository('Shift');
    const policyRepository = connection.getRepository('BreakPolicy');

    logger.info('🌱 Seeding break policies...');

    let created = 0;
    let skipped = 0;

    for (const policyData of breakPolicies) {
      // Find the shift
      const shift = await shiftRepository.findOne({ where: { name: policyData.shiftName } });
      
      if (!shift) {
        logger.warn(`   ⚠️  Shift "${policyData.shiftName}" not found, skipping policy...`);
        skipped++;
        continue;
      }

      // Check if policy already exists for this shift
      const existing = await policyRepository.findOne({ where: { shiftId: shift.id } });
      
      if (existing) {
        logger.info(`   ⏭️  Break policy for shift "${policyData.shiftName}" already exists, skipping...`);
        skipped++;
        continue;
      }

      // Create policy
      const { shiftName, ...policyFields } = policyData;
      const policy = {
        ...policyFields,
        shiftId: shift.id
      };

      await policyRepository.save(policy);
      logger.info(`   ✅ Created break policy for: ${policyData.shiftName} (Max: ${policy.maxBreaksPerDay} breaks/day, ${policy.minDuration}-${policy.maxDuration} min)`);
      created++;
    }

    logger.info(`✅ Break policies seeded successfully`);
    logger.info(`   ✅ Created: ${created}`);
    logger.info(`   ⏭️  Skipped: ${skipped}`);
    logger.info(' ');

    return { created, skipped };
  } catch (error) {
    logger.error('❌ Error seeding break policies:', error);
    throw error;
  }
}

async function rollback() {
  try {
    const connection = getConnection();
    const shiftRepository = connection.getRepository('Shift');
    const policyRepository = connection.getRepository('BreakPolicy');

    logger.info('🗑️  Rolling back break policies...');

    // Get shift IDs for our seeded shifts
    const shiftNames = breakPolicies.map(p => p.shiftName);
    const shifts = await shiftRepository
      .createQueryBuilder('shift')
      .where('shift.name IN (:...names)', { names: shiftNames })
      .getMany();

    const shiftIds = shifts.map(s => s.id);

    if (shiftIds.length > 0) {
      await policyRepository
        .createQueryBuilder()
        .delete()
        .where('shiftId IN (:...ids)', { ids: shiftIds })
        .execute();
    }

    logger.info('✅ Break policies rollback completed');
    logger.info(' ');
  } catch (error) {
    logger.error('❌ Error rolling back break policies:', error);
    throw error;
  }
}

module.exports = { seed, rollback };













