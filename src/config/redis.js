const redis = require('redis');
const logger = require('@utils/logger');

/**
 * Redis Configuration and Connection
 * 
 * Used for:
 * - OTP storage (with TTL)
 * - Rate limiting
 * - Session management
 */

let redisClient = null;

/**
 * Initialize Redis connection
 */
const initRedis = async () => {
  try {
    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT) || 6379;
    const password = process.env.REDIS_PASSWORD || '';
    const db = parseInt(process.env.REDIS_DB) || 0;

    // Redis v4 uses URL format
    let redisUrl = `redis://${host}:${port}/${db}`;
    if (password && password.trim() !== '') {
      redisUrl = `redis://:${password}@${host}:${port}/${db}`;
    }

    logger.info(`🔄 Connecting to Redis at ${host}:${port}...`);
    
    // Create client with v4 syntax
    redisClient = redis.createClient({
      url: redisUrl,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.error('Redis max retry attempts reached');
            return new Error('Max retries reached');
          }
          return Math.min(retries * 100, 1000);
        }
      }
    });

    // Setup event listeners
    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis error:', err.message || err);
    });

    redisClient.on('reconnecting', () => {
      logger.warn('⚠️  Redis reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('⚠️  Redis connection closed');
    });

    // Connect to Redis
    await redisClient.connect();
    logger.info('✅ Redis connection established');
    
  } catch (error) {
    logger.error('❌ Failed to initialize Redis:', error.message);
    throw error;
  }
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient || !redisClient.isOpen) {
    logger.error('Redis client not initialized or not connected');
    throw new Error('Redis client not initialized or not connected');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
    logger.info('🔌 Redis connection closed');
  }
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => {
  return redisClient && redisClient.isOpen;
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  isRedisConnected
};
