import db from '../db/database.js';

/**
 * Fund NAV History Model
 * Manages NAV history data with auto-cleanup (keeps latest 30 records per fund)
 */

export const fundNavHistoryModel = {
  /**
   * Insert or update NAV record
   * @param {number} schemeCode - Fund scheme code
   * @param {string} navDate - NAV date (YYYY-MM-DD or DD-MM-YYYY)
   * @param {number} navValue - NAV value
   * @returns {Promise} Database execution result
   */
  async upsertNavRecord(schemeCode, navDate, navValue) {
    // Convert DD-MM-YYYY to YYYY-MM-DD if needed
    const formattedDate = this.formatDateForDB(navDate);
    
    const query = `
      INSERT INTO fund_nav_history (scheme_code, nav_date, nav_value)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        nav_value = VALUES(nav_value),
        created_at = UNIX_TIMESTAMP() * 1000
    `;
    
    return db.execute(query, [schemeCode, formattedDate, navValue]);
  },

  /**
   * Auto-cleanup: Keep only latest N records per fund
   * @param {number} schemeCode - Fund scheme code
   * @param {number} keepLatest - Number of latest records to keep (default: 30)
   * @returns {Promise} Database execution result
   */
  async deleteOldRecords(schemeCode, keepLatest = 30) {
    const query = `
      DELETE FROM fund_nav_history 
      WHERE scheme_code = ? 
      AND id NOT IN (
        SELECT id FROM (
          SELECT id FROM fund_nav_history 
          WHERE scheme_code = ? 
          ORDER BY nav_date DESC 
          LIMIT ?
        ) AS recent_navs
      )
    `;
    
    return db.execute(query, [schemeCode, schemeCode, keepLatest]);
  },

  /**
   * Get latest NAV for a fund
   * @param {number} schemeCode - Fund scheme code
   * @returns {Promise<Object|null>} Latest NAV record or null
   */
  async getLatestNav(schemeCode) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_nav_history 
       WHERE scheme_code = ? 
       ORDER BY nav_date DESC 
       LIMIT 1`,
      [schemeCode]
    );
    return rows[0] || null;
  },

  /**
   * Get NAV history for date range
   * @param {number} schemeCode - Fund scheme code
   * @param {string} startDate - Start date (YYYY-MM-DD)
   * @param {string} endDate - End date (YYYY-MM-DD)
   * @param {number} limit - Maximum records (default: 30)
   * @returns {Promise<Array>} Array of NAV records
   */
  async getNavHistory(schemeCode, startDate, endDate, limit = 30) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_nav_history 
       WHERE scheme_code = ? 
       AND nav_date BETWEEN ? AND ?
       ORDER BY nav_date DESC 
       LIMIT ?`,
      [schemeCode, startDate, endDate, limit]
    );
    return rows;
  },

  /**
   * Get NAV for specific date
   * @param {number} schemeCode - Fund scheme code
   * @param {string} navDate - NAV date (YYYY-MM-DD)
   * @returns {Promise<Object|null>} NAV record or null
   */
  async getNavByDate(schemeCode, navDate) {
    const formattedDate = this.formatDateForDB(navDate);
    const [rows] = await db.execute(
      `SELECT * FROM fund_nav_history 
       WHERE scheme_code = ? AND nav_date = ?`,
      [schemeCode, formattedDate]
    );
    return rows[0] || null;
  },

  /**
   * Bulk insert NAV records (batch processing)
   * @param {Array} records - Array of {scheme_code, nav_date, nav_value}
   * @returns {Promise} Database execution result
   */
  async bulkInsertNav(records) {
    if (records.length === 0) return { affectedRows: 0 };

    const values = records.map(r => {
      const formattedDate = this.formatDateForDB(r.nav_date);
      return `(${r.scheme_code}, '${formattedDate}', ${r.nav_value})`;
    }).join(',');

    const query = `
      INSERT INTO fund_nav_history (scheme_code, nav_date, nav_value)
      VALUES ${values}
      ON DUPLICATE KEY UPDATE 
        nav_value = VALUES(nav_value),
        created_at = UNIX_TIMESTAMP() * 1000
    `;

    return db.execute(query);
  },

  /**
   * Get NAV record count for a fund
   * @param {number} schemeCode - Fund scheme code
   * @returns {Promise<number>} Count of NAV records
   */
  async getRecordCount(schemeCode) {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as count FROM fund_nav_history WHERE scheme_code = ?',
      [schemeCode]
    );
    return rows[0].count;
  },

  /**
   * Get oldest NAV date for a fund
   * @param {number} schemeCode - Fund scheme code
   * @returns {Promise<Object|null>} Oldest NAV record or null
   */
  async getOldestNav(schemeCode) {
    const [rows] = await db.execute(
      `SELECT * FROM fund_nav_history 
       WHERE scheme_code = ? 
       ORDER BY nav_date ASC 
       LIMIT 1`,
      [schemeCode]
    );
    return rows[0] || null;
  },

  /**
   * Delete all NAV records for a fund
   * @param {number} schemeCode - Fund scheme code
   * @returns {Promise} Database execution result
   */
  async deleteAllForFund(schemeCode) {
    return db.execute(
      'DELETE FROM fund_nav_history WHERE scheme_code = ?',
      [schemeCode]
    );
  },

  /**
   * Get total NAV records count across all funds
   * @returns {Promise<number>} Total count
   */
  async getTotalRecordCount() {
    const [rows] = await db.execute(
      'SELECT COUNT(*) as total FROM fund_nav_history'
    );
    return rows[0].total;
  },

  /**
   * Get funds with NAV data
   * @returns {Promise<Array>} Array of scheme_codes with NAV data
   */
  async getFundsWithNavData() {
    const [rows] = await db.execute(
      'SELECT DISTINCT scheme_code FROM fund_nav_history'
    );
    return rows.map(r => r.scheme_code);
  },

  /**
   * Format date for database (convert DD-MM-YYYY to YYYY-MM-DD)
   * @param {string} date - Date in DD-MM-YYYY or YYYY-MM-DD format
   * @returns {string} Date in YYYY-MM-DD format
   */
  formatDateForDB(date) {
    if (!date) return null;
    
    // If already in YYYY-MM-DD format, return as is
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      return date;
    }
    
    // Convert DD-MM-YYYY to YYYY-MM-DD
    if (date.match(/^\d{2}-\d{2}-\d{4}$/)) {
      const [day, month, year] = date.split('-');
      return `${year}-${month}-${day}`;
    }
    
    return date;
  }
};
