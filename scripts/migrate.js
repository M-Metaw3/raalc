require('dotenv').config();
const { createConnection } = require('typeorm');
const dbConfig = require('../src/config/database');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('🔄 Running database migrations...\n');
  
  try {
    const connection = await createConnection(dbConfig);
    console.log('✅ Database connected\n');
    
    const migrationsDir = path.join(__dirname, '../src/migrations');
    
    // Check if migrations directory exists
    if (!fs.existsSync(migrationsDir)) {
      console.log('⚠️  No migrations directory found');
      process.exit(0);
    }
    
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('⚠️  No migration files found');
      process.exit(0);
    }
    
    console.log(`📋 Found ${migrationFiles.length} migration(s):\n`);
    
    for (const file of migrationFiles) {
      console.log(`   - ${file}`);
    }
    
    console.log('\n🔄 Executing migrations...\n');
    
    // Create migrations table if it doesn't exist
    await connection.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(255) UNIQUE NOT NULL,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Get already executed migrations
    const executed = await connection.query('SELECT name FROM migrations');
    const executedNames = executed.map(m => m.name);
    
    // Run pending migrations
    let ranCount = 0;
    for (const file of migrationFiles) {
      const migrationName = file.replace('.js', '');
      
      if (executedNames.includes(migrationName)) {
        console.log(`   ⏭️  ${migrationName} (already executed)`);
        continue;
      }
      
      try {
        const migration = require(path.join(migrationsDir, file));
        const queryRunner = connection.createQueryRunner();
        
        await migration.up(queryRunner);
        
        // Record migration
        await connection.query(
          'INSERT INTO migrations (name) VALUES (?)',
          [migrationName]
        );
        
        console.log(`   ✅ ${migrationName}`);
        ranCount++;
      } catch (error) {
        console.error(`   ❌ ${migrationName} - ${error.message}`);
        throw error;
      }
    }
    
    console.log(`\n🎉 Migrations complete! (${ranCount} new, ${executedNames.length} previously executed)\n`);
    
    await connection.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

runMigrations();

