const logger = require('../utils/logger');

/**
 * Cache service for Redis operations
 */
class CacheService {
  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  static async get(key) {
    try {
      const value = await global.redis.get(key);
      
      if (!value) {
        logger.debug('Cache miss', { key });
        return null;
      }
      
      logger.debug('Cache hit', { key });
      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get error', { key, error: error.message });
      return null;
    }
  }
  
  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds (optional)
   */
  static async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      
      if (ttl) {
        await global.redis.setex(key, ttl, serialized);
      } else {
        await global.redis.set(key, serialized);
      }
      
      logger.debug('Cache set', { key, ttl });
      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error: error.message });
      return false;
    }
  }
  
  /**
   * Delete key from cache
   * @param {string} key - Cache key
   */
  static async del(key) {
    try {
      await global.redis.del(key);
      logger.debug('Cache delete', { key });
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error: error.message });
      return false;
    }
  }
  
  /**
   * Delete multiple keys by pattern
   * @param {string} pattern - Key pattern (e.g., 'user:*')
   */
  static async delPattern(pattern) {
    try {
      const keys = await global.redis.keys(pattern);
      
      if (keys.length > 0) {
        await global.redis.del(...keys);
        logger.debug('Cache delete pattern', { pattern, count: keys.length });
      }
      
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error: error.message });
      return 0;
    }
  }
  
  /**
   * Check if key exists
   * @param {string} key - Cache key
   */
  static async exists(key) {
    try {
      const exists = await global.redis.exists(key);
      return exists === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error: error.message });
      return false;
    }
  }
  
  /**
   * Get remaining TTL for key
   * @param {string} key - Cache key
   * @returns {Promise<number>} TTL in seconds, -1 if no TTL, -2 if key doesn't exist
   */
  static async ttl(key) {
    try {
      return await global.redis.ttl(key);
    } catch (error) {
      logger.error('Cache TTL error', { key, error: error.message });
      return -2;
    }
  }
  
  /**
   * Increment value
   * @param {string} key - Cache key
   * @param {number} amount - Amount to increment (default: 1)
   */
  static async incr(key, amount = 1) {
    try {
      if (amount === 1) {
        return await global.redis.incr(key);
      }
      return await global.redis.incrby(key, amount);
    } catch (error) {
      logger.error('Cache incr error', { key, error: error.message });
      return null;
    }
  }
  
  /**
   * Set value with expiry only if key doesn't exist
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   */
  static async setNX(key, value, ttl) {
    try {
      const serialized = JSON.stringify(value);
      const result = await global.redis.set(key, serialized, 'EX', ttl, 'NX');
      return result === 'OK';
    } catch (error) {
      logger.error('Cache setNX error', { key, error: error.message });
      return false;
    }
  }
}

module.exports = CacheService;

