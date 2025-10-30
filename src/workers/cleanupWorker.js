const { Worker } = require('../services/Queue');
const { connection } = require('../services/Queue');
const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

// Cleanup worker - handles file cleanup, cache expiry, etc.
new Worker('cleanup', async (job) => {
  const { type, data } = job.data;
  
  logger.info('Processing cleanup job', { jobId: job.id, type });
  
  try {
    switch (type) {
      case 'temp-files':
        await cleanupTempFiles(data);
        break;
        
      case 'old-logs':
        await cleanupOldLogs(data);
        break;
        
      case 'expired-sessions':
        await cleanupExpiredSessions(data);
        break;
        
      default:
        logger.warn('Unknown cleanup type', { type });
    }
    
    logger.info('Cleanup completed', { jobId: job.id, type });
    return { success: true };
  } catch (error) {
    logger.error('Cleanup failed', {
      jobId: job.id,
      type,
      error: error.message
    });
    throw error;
  }
}, {
  connection,
  concurrency: 2
});

/**
 * Clean up temporary files older than specified age
 */
async function cleanupTempFiles(data) {
  const { directory = 'temp', maxAge = 24 * 60 * 60 * 1000 } = data || {};
  
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    logger.info('Temp files cleanup completed', { deletedCount });
  } catch (error) {
    logger.error('Temp files cleanup failed', { error: error.message });
  }
}

/**
 * Clean up old log files
 */
async function cleanupOldLogs(data) {
  const { directory = 'logs', maxAge = 30 * 24 * 60 * 60 * 1000 } = data || {};
  
  try {
    const files = await fs.readdir(directory);
    const now = Date.now();
    let deletedCount = 0;
    
    for (const file of files) {
      if (!file.endsWith('.log')) continue;
      
      const filePath = path.join(directory, file);
      const stats = await fs.stat(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    logger.info('Old logs cleanup completed', { deletedCount });
  } catch (error) {
    logger.error('Old logs cleanup failed', { error: error.message });
  }
}

/**
 * Clean up expired sessions from cache
 */
async function cleanupExpiredSessions(data) {
  // TODO: Implement session cleanup logic
  logger.info('Expired sessions cleanup completed');
}

logger.info('✅ Cleanup worker registered');

