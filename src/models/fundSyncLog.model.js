import db from '../db/database.js';

/**
 * Fund Sync Log Model
 * Manages ingestion audit trail in fund_sync_log table
 */

export const fundSyncLogModel = {
  /**
   * Start new sync and return sync ID
   * @param {string} syncType - 'FULL' or 'INCREMENTAL'
   * @returns {Promise<number>} Sync log ID
   */
  async startSync(syncType) {
    const [result] = await db.execute(
      `INSERT INTO fund_sync_log (sync_type, sync_status, start_time)
       VALUES (?, 'STARTED', ?)`,
      [syncType, Date.now()]
    );
    return result.insertId;
  },

  /**
   * Update sync progress (incremental updates)
   * @param {number} syncId - Sync log ID
   * @param {Object} stats - Progress statistics
   * @returns {Promise} Database execution result
   */
  async updateSyncProgress(syncId, stats) {
    const query = `
      UPDATE fund_sync_log 
      SET total_funds_fetched = ?,
          funds_inserted = ?,
          funds_updated = ?,
          nav_records_inserted = ?,
          error_count = ?
      WHERE id = ?
    `;

    return db.execute(query, [
      stats.totalFetched || 0,
      stats.inserted || 0,
      stats.updated || 0,
      stats.navInserted || 0,
      stats.errors || 0,
      syncId
    ]);
  },

  /**
   * Complete sync successfully
   * @param {number} syncId - Sync log ID
   * @param {Object} finalStats - Final statistics
   * @returns {Promise} Database execution result
   */
  async completeSyncSuccess(syncId, finalStats) {
    const now = Date.now();
    
    const query = `
      UPDATE fund_sync_log 
      SET sync_status = ?,
          end_time = ?,
          total_funds_fetched = ?,
          funds_inserted = ?,
          funds_updated = ?,
          nav_records_inserted = ?,
          error_count = ?,
          execution_duration_ms = ?
      WHERE id = ?
    `;

    // Determine status based on errors
    const status = finalStats.errors > 0 ? 'PARTIAL' : 'SUCCESS';

    // Get start_time to calculate duration
    const [syncRecord] = await db.execute(
      'SELECT start_time FROM fund_sync_log WHERE id = ?',
      [syncId]
    );
    const duration = syncRecord[0] ? now - syncRecord[0].start_time : null;

    return db.execute(query, [
      status,
      now,
      finalStats.totalFetched || 0,
      finalStats.inserted || 0,
      finalStats.updated || 0,
      finalStats.navInserted || 0,
      finalStats.errors || 0,
      duration,
      syncId
    ]);
  },

  /**
   * Complete sync with failure
   * @param {number} syncId - Sync log ID
   * @param {Error} error - Error object
   * @returns {Promise} Database execution result
   */
  async completeSyncFailure(syncId, error) {
    const now = Date.now();

    // Get start_time to calculate duration
    const [syncRecord] = await db.execute(
      'SELECT start_time FROM fund_sync_log WHERE id = ?',
      [syncId]
    );
    const duration = syncRecord[0] ? now - syncRecord[0].start_time : null;

    const query = `
      UPDATE fund_sync_log 
      SET sync_status = 'FAILED',
          end_time = ?,
          execution_duration_ms = ?,
          error_details = ?
      WHERE id = ?
    `;

    const errorDetails = error ? `${error.message}\n${error.stack}` : 'Unknown error';

    return db.execute(query, [now, duration, errorDetails, syncId]);
  },

  /**
   * Get recent syncs
   * @param {number} limit - Maximum number of records (default: 10)
   * @returns {Promise<Array>} Array of sync log records
   */
  async getRecentSyncs(limit = 10) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_sync_log 
       ORDER BY start_time DESC 
       LIMIT ?`,
      [limit]
    );
    return rows;
  },

  /**
   * Get sync by ID
   * @param {number} syncId - Sync log ID
   * @returns {Promise<Object|null>} Sync log record or null
   */
  async getSyncById(syncId) {
    const [rows] = await db.execute(
      'SELECT * FROM fund_sync_log WHERE id = ?',
      [syncId]
    );
    return rows[0] || null;
  },

  /**
   * Get syncs by status
   * @param {string} status - Sync status (STARTED, SUCCESS, PARTIAL, FAILED)
   * @param {number} limit - Maximum records (default: 50)
   * @returns {Promise<Array>} Array of sync log records
   */
  async getSyncsByStatus(status, limit = 50) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_sync_log 
       WHERE sync_status = ?
       ORDER BY start_time DESC 
       LIMIT ?`,
      [status, limit]
    );
    return rows;
  },

  /**
   * Get syncs by type
   * @param {string} syncType - Sync type (FULL or INCREMENTAL)
   * @param {number} limit - Maximum records (default: 50)
   * @returns {Promise<Array>} Array of sync log records
   */
  async getSyncsByType(syncType, limit = 50) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_sync_log 
       WHERE sync_type = ?
       ORDER BY start_time DESC 
       LIMIT ?`,
      [syncType, limit]
    );
    return rows;
  },

  /**
   * Get syncs by date range
   * @param {number} startTime - Start timestamp (milliseconds)
   * @param {number} endTime - End timestamp (milliseconds)
   * @returns {Promise<Array>} Array of sync log records
   */
  async getSyncsByDateRange(startTime, endTime) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_sync_log 
       WHERE start_time BETWEEN ? AND ?
       ORDER BY start_time DESC`,
      [startTime, endTime]
    );
    return rows;
  },

  /**
   * Get sync statistics
   * @param {number} days - Number of days to look back (default: 30)
   * @returns {Promise<Object>} Statistics object
   */
  async getSyncStatistics(days = 30) {
    const startTime = Date.now() - (days * 24 * 60 * 60 * 1000);

    const [stats] = await db.execute(
      `SELECT 
        COUNT(*) as total_syncs,
        SUM(CASE WHEN sync_status = 'SUCCESS' THEN 1 ELSE 0 END) as successful_syncs,
        SUM(CASE WHEN sync_status = 'PARTIAL' THEN 1 ELSE 0 END) as partial_syncs,
        SUM(CASE WHEN sync_status = 'FAILED' THEN 1 ELSE 0 END) as failed_syncs,
        AVG(execution_duration_ms) as avg_duration_ms,
        MAX(execution_duration_ms) as max_duration_ms,
        MIN(execution_duration_ms) as min_duration_ms,
        SUM(total_funds_fetched) as total_funds_processed,
        SUM(nav_records_inserted) as total_nav_records,
        SUM(error_count) as total_errors
       FROM fund_sync_log
       WHERE start_time >= ?`,
      [startTime]
    );

    return stats[0] || {
      total_syncs: 0,
      successful_syncs: 0,
      partial_syncs: 0,
      failed_syncs: 0,
      avg_duration_ms: 0,
      max_duration_ms: 0,
      min_duration_ms: 0,
      total_funds_processed: 0,
      total_nav_records: 0,
      total_errors: 0
    };
  },

  /**
   * Get last successful sync
   * @param {string} syncType - Optional sync type filter
   * @returns {Promise<Object|null>} Last successful sync record or null
   */
  async getLastSuccessfulSync(syncType = null) {
    let query = `
      SELECT * FROM fund_sync_log 
      WHERE sync_status IN ('SUCCESS', 'PARTIAL')
    `;
    const params = [];

    if (syncType) {
      query += ' AND sync_type = ?';
      params.push(syncType);
    }

    query += ' ORDER BY end_time DESC LIMIT 1';

    const [rows] = await db.execute(query, params);
    return rows[0] || null;
  },

  /**
   * Clean up old sync logs
   * @param {number} daysToKeep - Number of days to retain (default: 90)
   * @returns {Promise} Database execution result
   */
  async cleanupOldLogs(daysToKeep = 90) {
    const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
    
    return db.execute(
      'DELETE FROM fund_sync_log WHERE start_time < ?',
      [cutoffTime]
    );
  }
};
