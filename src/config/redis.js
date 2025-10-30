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
  return new Promise((resolve, reject) => {
    redisClient = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || "StrongRedisPass123!",
      db: parseInt(process.env.REDIS_DB) || 0,
      retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
          logger.error('Redis connection refused');
          return new Error('Redis server refused connection');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
          logger.error('Redis retry time exhausted');
          return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
          logger.error('Redis max retry attempts reached');
          return undefined;
        }
        // Reconnect after
        return Math.min(options.attempt * 100, 3000);
      }
    });

    redisClient.on('connect', () => {
      logger.info('✅ Redis connected successfully');
      resolve();
    });

    redisClient.on('ready', () => {
      logger.info('✅ Redis ready to accept commands');
    });

    redisClient.on('error', (err) => {
      logger.error('❌ Redis error:', err);
      if (!redisClient.connected) {
        reject(err);
      }
    });

    redisClient.on('reconnecting', () => {
      logger.warn('⚠️  Redis reconnecting...');
    });

    redisClient.on('end', () => {
      logger.warn('⚠️  Redis connection closed');
    });
  });
};

/**
 * Get Redis client instance
 */
const getRedisClient = () => {
  if (!redisClient || !redisClient.connected) {
    throw new Error('Redis client not initialized or not connected');
  }
  return redisClient;
};

/**
 * Close Redis connection
 */
const closeRedis = () => {
  if (redisClient) {
    redisClient.quit();
    logger.info('🔌 Redis connection closed');
  }
};

/**
 * Check if Redis is connected
 */
const isRedisConnected = () => {
  return redisClient && redisClient.connected;
};

module.exports = {
  initRedis,
  getRedisClient,
  closeRedis,
  isRedisConnected
};
