require('dotenv').config();
const mysql = require('mysql2/promise');

/**
 * Create Complaints Table Script
 * 
 * Creates the complaints table directly in the database
 */

async function createComplaintsTable() {
  let connection;

  try {
    console.log('🔄 Connecting to database...\n');

    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'raalc_db',
      multipleStatements: true
    });

    console.log('✅ Database connected\n');
    console.log('🔄 Creating complaints table...\n');

    // Create table SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS \`complaints\` (
        \`id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`firstName\` VARCHAR(100) NOT NULL COMMENT 'Complainant first name',
        \`lastName\` VARCHAR(100) NOT NULL COMMENT 'Complainant last name',
        \`email\` VARCHAR(255) NOT NULL COMMENT 'Complainant email',
        \`phoneNumber\` VARCHAR(20) NULL COMMENT 'Complainant phone number',
        \`complaintType\` ENUM('financial', 'technical', 'service', 'other') NOT NULL DEFAULT 'other' COMMENT 'Type of complaint',
        \`departmentId\` INT UNSIGNED NULL COMMENT 'Department ID related to this complaint',
        \`description\` TEXT NOT NULL COMMENT 'Complaint description/details',
        \`attachments\` JSON NULL COMMENT 'Array of attachment file paths',
        \`status\` ENUM('pending', 'in_progress', 'resolved', 'rejected', 'closed') NOT NULL DEFAULT 'pending' COMMENT 'Complaint status',
        \`resolutionNotes\` TEXT NULL COMMENT 'Admin notes about resolution',
        \`resolvedAt\` DATETIME NULL COMMENT 'When complaint was resolved',
        \`userId\` INT UNSIGNED NULL COMMENT 'User ID if complaint submitted by authenticated user',
        \`resolvedBy\` INT UNSIGNED NULL COMMENT 'Admin ID who resolved the complaint',
        \`deletedAt\` DATETIME NULL COMMENT 'Soft delete timestamp',
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        INDEX \`idx_complaints_user_id\` (\`userId\`),
        INDEX \`idx_complaints_resolved_by\` (\`resolvedBy\`),
        INDEX \`idx_complaints_status\` (\`status\`),
        INDEX \`idx_complaints_complaint_type\` (\`complaintType\`),
        INDEX \`idx_complaints_department_id\` (\`departmentId\`),
        INDEX \`idx_complaints_email\` (\`email\`),
        INDEX \`idx_complaints_deleted_at\` (\`deletedAt\`),
        INDEX \`idx_complaints_status_created\` (\`status\`, \`createdAt\`),
        CONSTRAINT \`fk_complaints_user\` FOREIGN KEY (\`userId\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_complaints_resolver\` FOREIGN KEY (\`resolvedBy\`) REFERENCES \`admins\`(\`id\`) ON DELETE SET NULL,
        CONSTRAINT \`fk_complaints_department\` FOREIGN KEY (\`departmentId\`) REFERENCES \`departments\`(\`id\`) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.query(createTableSQL);

    console.log('✅ Complaints table created successfully!\n');
    console.log('🎉 Done! You can now use the complaints API.\n');

    await connection.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating complaints table:', error.message);
    console.error(error);
    
    if (connection) {
      await connection.end();
    }
    
    process.exit(1);
  }
}

createComplaintsTable();

