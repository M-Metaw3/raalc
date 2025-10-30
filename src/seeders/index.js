const { createConnection } = require('typeorm');
const logger = require('@utils/logger');

/**
 * Seeders Index
 * 
 * Master file to run all seeders in order
 */

// Import all seeders in order
const seeders = [
  require('./01-roles.seeder'),
  require('./02-permissions.seeder'),
  require('./03-role-permissions.seeder'),
  require('./04-super-admin.seeder'),
  require('./05-departments.seeder'),
  require('./06-shifts.seeder'),
  require('./07-break-policies.seeder')
];

/**
 * Run all seeders
 */
async function runSeeders() {
  let connection;

  try {
    logger.info('🚀 Starting database seeding...\n');

    // Connect to database
    connection = await createConnection(require('@config/database'));
    logger.info('✅ Database connected\n');

    // Run each seeder
    for (const seeder of seeders) {
      // Old seeders use 'run', new ones use 'seed'
      if (seeder.run) {
        await seeder.run();
      } else if (seeder.seed) {
        await seeder.seed();
      }
    }

    logger.info('🎉 All seeders completed successfully!');
    logger.info('');
  } catch (error) {
    logger.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    if (connection && connection.isConnected) {
      await connection.close();
      logger.info('✅ Database connection closed');
    }
  }
}

/**
 * Rollback all seeders (for development)
 */
async function rollbackSeeders() {
  let connection;

  try {
    logger.info('🔄 Starting database seeding rollback...\n');

    // Connect to database
    connection = await createConnection(require('@config/database'));
    logger.info('✅ Database connected\n');

    // Rollback in reverse order
    for (const seeder of seeders.reverse()) {
      await seeder.rollback();
    }

    logger.info('🎉 All seeders rolled back successfully!');
    logger.info('');
  } catch (error) {
    logger.error('❌ Rollback failed:', error);
    process.exit(1);
  } finally {
    if (connection && connection.isConnected) {
      await connection.close();
      logger.info('✅ Database connection closed');
    }
  }
}

// Run seeders if called directly
if (require.main === module) {
  const command = process.argv[2];

  if (command === 'rollback') {
    rollbackSeeders();
  } else {
    runSeeders();
  }
}

module.exports = { runSeeders, rollbackSeeders };

