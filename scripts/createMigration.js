#!/usr/bin/env node

/**
 * Create a new migration file
 * Usage: node scripts/createMigration.js MigrationName
 */

const fs = require('fs');
const path = require('path');

const migrationName = process.argv[2];

if (!migrationName) {
  console.error('❌ Please provide a migration name');
  console.log('Usage: node scripts/createMigration.js MigrationName');
  console.log('Example: node scripts/createMigration.js CreateUsersTable');
  process.exit(1);
}

// Generate timestamp
const timestamp = Date.now();
const fileName = `${timestamp}-${migrationName}.js`;
const migrationsDir = path.join(__dirname, '../src/migrations');

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

const template = `/**
 * Migration: ${migrationName}
 * Created: ${new Date().toISOString()}
 */

module.exports = {
  /**
   * Run the migration
   */
  up: async (queryRunner) => {
    // Add your migration logic here
    // Example:
    // await queryRunner.query(\`
    //   CREATE TABLE example (
    //     id INT PRIMARY KEY AUTO_INCREMENT,
    //     name VARCHAR(255) NOT NULL,
    //     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    //   )
    // \`);
  },

  /**
   * Reverse the migration
   */
  down: async (queryRunner) => {
    // Add your rollback logic here
    // Example:
    // await queryRunner.query('DROP TABLE example');
  }
};
`;

const filePath = path.join(migrationsDir, fileName);
fs.writeFileSync(filePath, template);

console.log('✅ Migration created successfully!\n');
console.log(`📄 File: ${fileName}`);
console.log(`📁 Path: ${filePath}\n`);
console.log('Next steps:');
console.log('1. Edit the migration file and add your SQL');
console.log('2. Run: npm run migrate');

