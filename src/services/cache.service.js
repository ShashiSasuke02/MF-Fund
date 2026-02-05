import Redis from 'ioredis';
import { query, queryOne, run } from '../db/database.js';

/**
 * Cache Service - Hybrid Redis + MySQL caching
 * 
 * Strategy:
 * 1. Try Redis first (fast, in-memory)
 * 2. Graceful fallback to MySQL api_cache table if Redis unavailable
 * 3. Does NOT break existing functionality if Redis is down
 */
class CacheService {
  constructor() {
    this.redis = null;
    this.redisConnected = false;
    this.redisEnabled = process.env.REDIS_ENABLED !== 'false'; // Enabled by default
    this.initRedis();
  }

  /**
   * Initialize Redis connection with error handling
   */
  initRedis() {
    if (!this.redisEnabled) {
      console.log('[Cache] Redis disabled via REDIS_ENABLED=false, using MySQL fallback.');
      return;
    }

    const host = process.env.REDIS_HOST || 'localhost';
    const port = parseInt(process.env.REDIS_PORT || '6379');

    try {
      this.redis = new Redis({
        host,
        port,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            console.warn('[Cache] Redis connection failed, falling back to MySQL.');
            this.redisConnected = false;
            return null; // Stop retrying
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true // Don't connect until first command
      });

      this.redis.on('connect', () => {
        console.log('[Cache] ✅ Redis connected:', `${host}:${port}`);
        this.redisConnected = true;
      });

      this.redis.on('error', (err) => {
        if (this.redisConnected) {
          console.warn('[Cache] Redis error:', err.message);
        }
        this.redisConnected = false;
      });

      this.redis.on('close', () => {
        this.redisConnected = false;
      });

      // Attempt initial connection
      this.redis.connect().catch(() => {
        // Connection failed, will use MySQL fallback
        console.warn('[Cache] Initial Redis connection failed, using MySQL.');
      });

    } catch (err) {
      console.warn('[Cache] Redis initialization failed:', err.message);
      this.redis = null;
    }
  }

  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {object|null} - Cached data or null if expired/missing
   */
  async get(key) {
    // Try Redis first
    if (this.redis && this.redisConnected) {
      try {
        const data = await this.redis.get(key);
        if (data) {
          return JSON.parse(data);
        }
        // Not in Redis, check MySQL then cache to Redis
      } catch (err) {
        console.warn('[Cache] Redis GET failed:', err.message);
      }
    }

    // Fallback to MySQL
    const now = Date.now();
    const row = await queryOne(`
      SELECT response_json, expires_at 
      FROM api_cache 
      WHERE cache_key = ? AND expires_at > ?
    `, [key, now]);

    if (row) {
      try {
        const parsed = JSON.parse(row.response_json);
        // Promote to Redis for next time
        if (this.redis && this.redisConnected) {
          const remainingTtl = Math.max(0, Math.floor((row.expires_at - now) / 1000));
          this.redis.setex(key, remainingTtl, row.response_json).catch(() => { });
        }
        return parsed;
      } catch (e) {
        console.error('[Cache] Failed to parse cached JSON:', e.message);
        return null;
      }
    }

    return null;
  }

  /**
   * Set cache data (writes to both Redis and MySQL for durability)
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  async set(key, data, ttlMs) {
    const jsonData = JSON.stringify(data);
    const ttlSeconds = Math.floor(ttlMs / 1000);
    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Write to Redis (non-blocking)
    if (this.redis && this.redisConnected) {
      this.redis.setex(key, ttlSeconds, jsonData).catch((err) => {
        console.warn('[Cache] Redis SET failed:', err.message);
      });
    }

    // Write to MySQL (for durability / fallback)
    await run(`
      INSERT INTO api_cache (cache_key, response_json, fetched_at, expires_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        response_json = VALUES(response_json),
        fetched_at = VALUES(fetched_at),
        expires_at = VALUES(expires_at)
    `, [key, jsonData, now, expiresAt]);
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    // Delete from Redis
    if (this.redis && this.redisConnected) {
      this.redis.del(key).catch(() => { });
    }

    // Delete from MySQL
    await run('DELETE FROM api_cache WHERE cache_key = ?', [key]);
  }

  /**
   * Clear all expired cache entries (MySQL only - Redis auto-expires)
   * @returns {number} - Number of entries cleared
   */
  async clearExpired() {
    const now = Date.now();
    const result = await run('DELETE FROM api_cache WHERE expires_at <= ?', [now]);
    return result.changes;
  }

  /**
   * Clear all cache entries
   * @returns {number} - Number of entries cleared
   */
  async clearAll() {
    // Flush Redis
    if (this.redis && this.redisConnected) {
      try {
        await this.redis.flushdb();
      } catch (err) {
        console.warn('[Cache] Redis FLUSHDB failed:', err.message);
      }
    }

    // Clear MySQL
    const result = await run('DELETE FROM api_cache');
    return result.changes;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  async getStats() {
    const now = Date.now();

    // MySQL stats
    const total = await queryOne('SELECT COUNT(*) as count FROM api_cache');
    const valid = await queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at > ?', [now]);
    const expired = await queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at <= ?', [now]);

    // Redis stats
    let redisKeys = 0;
    if (this.redis && this.redisConnected) {
      try {
        redisKeys = await this.redis.dbsize();
      } catch (err) {
        // Ignore
      }
    }

    return {
      mysql: {
        total: total?.count || 0,
        valid: valid?.count || 0,
        expired: expired?.count || 0
      },
      redis: {
        connected: this.redisConnected,
        keys: redisKeys
      }
    };
  }

  /**
   * Check if Redis is healthy
   * @returns {boolean}
   */
  isRedisHealthy() {
    return this.redis !== null && this.redisConnected;
  }
}

export const cacheService = new CacheService();
export default cacheService;
