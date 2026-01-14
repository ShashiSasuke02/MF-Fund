import { query, queryOne, run } from '../db/database.js';

/**
 * Cache Service - manages API response caching in SQLite
 */
class CacheService {
  /**
   * Get cached data by key
   * @param {string} key - Cache key
   * @returns {object|null} - Cached data or null if expired/missing
   */
  get(key) {
    const now = Date.now();
    
    const row = queryOne(`
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
  set(key, data, ttlMs) {
    const now = Date.now();
    const expiresAt = now + ttlMs;
    
    run(`
      INSERT OR REPLACE INTO api_cache (cache_key, response_json, fetched_at, expires_at)
      VALUES (?, ?, ?, ?)
    `, [key, JSON.stringify(data), now, expiresAt]);
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    run('DELETE FROM api_cache WHERE cache_key = ?', [key]);
  }

  /**
   * Clear all expired cache entries
   * @returns {number} - Number of entries cleared
   */
  clearExpired() {
    const now = Date.now();
    const result = run('DELETE FROM api_cache WHERE expires_at <= ?', [now]);
    return result.changes;
  }

  /**
   * Clear all cache entries
   * @returns {number} - Number of entries cleared
   */
  clearAll() {
    const result = run('DELETE FROM api_cache');
    return result.changes;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    const now = Date.now();
    
    const total = queryOne('SELECT COUNT(*) as count FROM api_cache');
    const valid = queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at > ?', [now]);
    const expired = queryOne('SELECT COUNT(*) as count FROM api_cache WHERE expires_at <= ?', [now]);
    
    return {
      total: total?.count || 0,
      valid: valid?.count || 0,
      expired: expired?.count || 0
    };
  }
}

export const cacheService = new CacheService();
export default cacheService;
