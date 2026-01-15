import { query, queryOne, run } from '../db/database.js';

/**
 * Cache Service - manages API response caching in MySQL
 */
class CacheService {
  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {object|null} - Cached data or null if expired/missing
   */
  async get(key) {
    const now = Date.now();
    
    const row = await queryOne(`
      SELECT response_json, expires_at 
      FROM api_cache 
      WHERE cache_key = ? AND expires_at > ?
    `, [key, now]);
    
    if (row) {
      try {
        return JSON.parse(row.response_json);
      } catch (e) {
        console.error('[Cache] Failed to parse cached JSON:', e.message);
        return null;
      }
    }
    
    return null;
  }

  /**
   * Set cache data
   * @param {string} key - Cache key
   * @param {object} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds
   */
  async set(key, data, ttlMs) {
    const now = Date.now();
    const expiresAt = now + ttlMs;
    
    await run(`
      INSERT INTO api_cache (cache_key, response_json, fetched_at, expires_at)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        response_json = VALUES(response_json),
        fetched_at = VALUES(fetched_at),
        expires_at = VALUES(expires_at)
    `, [key, JSON.stringify(data), now, expiresAt]);
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  async delete(key) {
    await run('DELETE FROM api_cache WHERE cache_key = ?', [key]);
  }

  /**
   * Clear all expired cache entries
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
    const result = await run('DELETE FROM api_cache');
    return result.changes;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  async getStats() {
    const now = Date.now();
    
    const total = await queryOne('SELECT COUNT(*) as count FROM api_cache');
    const valid = await queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at > ?', [now]);
    const expired = await queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at <= ?', [now]);
    
    return {
      total: total?.count || 0,
      valid: valid?.count || 0,
      expired: expired?.count || 0
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
