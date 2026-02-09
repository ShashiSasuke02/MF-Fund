import db from '../db/database.js';

/**
 * Fund Model - Master Fund Directory (10 AMCs)
 * Manages fund master data in the funds table
 */

export const fundModel = {
  /**
   * Insert or update fund master record
   * @param {Object} fundData - Fund data object
   * @returns {Promise} Database execution result
   */
  async upsertFund(fundData) {
    const query = `
      INSERT INTO funds (
        scheme_code, scheme_name, scheme_category, scheme_type,
        fund_house, amc_code, launch_date, isin, is_active,
        updated_at, last_synced_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        scheme_name = VALUES(scheme_name),
        scheme_category = VALUES(scheme_category),
        scheme_type = VALUES(scheme_type),
        fund_house = VALUES(fund_house),
        amc_code = VALUES(amc_code),
        launch_date = VALUES(launch_date),
        isin = VALUES(isin),
        is_active = VALUES(is_active),
        updated_at = VALUES(updated_at),
        last_synced_at = VALUES(last_synced_at)
    `;

    const now = Date.now();

    return db.run(query, [
      fundData.scheme_code,
      fundData.scheme_name,
      fundData.scheme_category || null,
      fundData.scheme_type || null,
      fundData.fund_house,
      fundData.amc_code || null,
      fundData.launch_date || null,
      fundData.isin || null,
      fundData.is_active !== undefined ? fundData.is_active : true,
      now,
      now
    ]);
  },

  /**
   * Bulk upsert funds (batch processing)
   * @param {Array} fundsArray - Array of fund data objects
   * @returns {Promise} Database execution result
   */
  async bulkUpsertFunds(fundsArray) {
    if (fundsArray.length === 0) return { affectedRows: 0 };

    const now = Date.now();
    const values = fundsArray.map(fund =>
      `(${fund.scheme_code}, ${db.escape(fund.scheme_name)}, ${db.escape(fund.scheme_category || null)}, ${db.escape(fund.scheme_type || null)}, ${db.escape(fund.fund_house)}, ${db.escape(fund.amc_code || null)}, ${db.escape(fund.launch_date || null)}, ${db.escape(fund.isin || null)}, ${fund.is_active !== undefined ? fund.is_active : true}, ${now}, ${now})`
    ).join(',');

    const query = `
      INSERT INTO funds (
        scheme_code, scheme_name, scheme_category, scheme_type,
        fund_house, amc_code, launch_date, isin, is_active,
        updated_at, last_synced_at
      )
      VALUES ${values}
      ON DUPLICATE KEY UPDATE
        scheme_name = VALUES(scheme_name),
        scheme_category = VALUES(scheme_category),
        scheme_type = VALUES(scheme_type),
        fund_house = VALUES(fund_house),
        amc_code = VALUES(amc_code),
        launch_date = VALUES(launch_date),
        isin = VALUES(isin),
        is_active = VALUES(is_active),
        updated_at = VALUES(updated_at),
        last_synced_at = VALUES(last_synced_at)
    `;

    return db.run(query);
  },

  /**
   * Get single fund by scheme code
   * @param {number} schemeCode - Fund scheme code
   * @returns {Promise<Object|null>} Fund object or null
   */
  async findBySchemeCode(schemeCode) {
    return db.queryOne('SELECT * FROM funds WHERE scheme_code = ?', [schemeCode]);
  },

  /**
   * Get all active funds for specific AMC
   * @param {string} fundHouse - AMC name
   * @param {Object} options - Filter options
   * @returns {Promise<Array>} Array of funds
   */
  async findByFundHouse(fundHouse, options = {}) {
    let query = 'SELECT * FROM funds WHERE fund_house = ? AND is_active = true';
    const params = [fundHouse];

    if (options.category) {
      query += ' AND scheme_category = ?';
      params.push(options.category);
    }

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.query(query, params);
  },

  /**
   * Search funds by name
   * @param {string} searchQuery - Search term
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Array of matching funds
   */
  async searchFunds(searchQuery, filters = {}) {
    let query = 'SELECT * FROM funds WHERE scheme_name LIKE ? AND is_active = true';
    const params = [`%${searchQuery}%`];

    if (filters.category) {
      query += ' AND scheme_category = ?';
      params.push(filters.category);
    }

    if (filters.fundHouse) {
      query += ' AND fund_house = ?';
      params.push(filters.fundHouse);
    }

    query += ' ORDER BY scheme_name';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    return db.query(query, params);
  },

  /**
   * Get all active funds
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of all active funds
   */
  async getAllActiveFunds(options = {}) {
    let query = 'SELECT * FROM funds WHERE is_active = true';
    const params = [];

    if (options.fundHouse) {
      query += ' AND fund_house = ?';
      params.push(options.fundHouse);
    }

    query += ' ORDER BY fund_house, scheme_name';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    return db.query(query, params);
  },

  /**
   * Mark funds as inactive (soft delete)
   * @param {Array<number>} schemeCodes - Array of scheme codes to deactivate
   * @returns {Promise} Database execution result
   */
  async markInactive(schemeCodes) {
    if (schemeCodes.length === 0) return { affectedRows: 0 };

    const placeholders = schemeCodes.map(() => '?').join(',');
    const query = `
      UPDATE funds 
      SET is_active = false, updated_at = ?
      WHERE scheme_code IN (${placeholders})
    `;

    return db.run(query, [Date.now(), ...schemeCodes]);
  },

  /**
   * Mark funds as active
   * @param {Array<number>} schemeCodes - Array of scheme codes to activate
   * @returns {Promise} Database execution result
   */
  async markActive(schemeCodes) {
    if (schemeCodes.length === 0) return { affectedRows: 0 };

    const placeholders = schemeCodes.map(() => '?').join(',');
    const query = `
      UPDATE funds 
      SET is_active = true, updated_at = ?
      WHERE scheme_code IN (${placeholders})
    `;

    return db.run(query, [Date.now(), ...schemeCodes]);
  },

  /**
   * Get fund count by fund house
   * @returns {Promise<Array>} Array of {fund_house, count} objects
   */
  async getFundCountByAMC() {
    return db.query(`
      SELECT fund_house, COUNT(*) as count
      FROM funds
      WHERE is_active = true
      GROUP BY fund_house
      ORDER BY count DESC
    `);
  },

  /**
   * Get fund count by category
   * @returns {Promise<Array>} Array of {scheme_category, count} objects
   */
  async getFundCountByCategory() {
    return db.query(`
      SELECT scheme_category, COUNT(*) as count
      FROM funds
      WHERE is_active = true AND scheme_category IS NOT NULL
      GROUP BY scheme_category
      ORDER BY count DESC
    `);
  },

  /**
   * Get total fund count
   * @param {Object} filters - Optional filters
   * @returns {Promise<number>} Total count
   */
  async getTotalCount(filters = {}) {
    let query = 'SELECT COUNT(*) as total FROM funds WHERE is_active = true';
    const params = [];

    if (filters.fundHouse) {
      query += ' AND fund_house = ?';
      params.push(filters.fundHouse);
    }

    const row = await db.queryOne(query, params);
    return row ? row.total : 0;
  },

  /**
   * Update fund metadata (category, ISIN, etc.)
   * @param {number} schemeCode - Scheme code
   * @param {Object} meta - Metadata key-values
   * @returns {Promise} Execution result
   */
  async updateMeta(schemeCode, meta) {
    const fields = [];
    const values = [];

    if (meta.scheme_category !== undefined) {
      fields.push('scheme_category = ?');
      values.push(meta.scheme_category);
    }
    if (meta.isin !== undefined) {
      fields.push('isin = ?');
      values.push(meta.isin);
    }
    if (meta.fund_house !== undefined) {
      fields.push('fund_house = ?');
      values.push(meta.fund_house);
    }

    if (fields.length === 0) return { affectedRows: 0 };

    // Update timestamp
    fields.push('updated_at = ?');
    values.push(Date.now());

    // Where clause
    values.push(schemeCode);

    const query = `UPDATE funds SET ${fields.join(', ')} WHERE scheme_code = ?`;
    return db.run(query, values);
  },

  /**
   * Update enrichment data (AUM, Risk, Returns, etc.)
   * @param {number} schemeCode - Scheme code
   * @param {Object} data - Enrichment data
   * @returns {Promise} Execution result
   */
  async updateEnrichmentData(schemeCode, data) {
    const fields = [];
    const values = [];

    const allowedFields = [
      'aum', 'expense_ratio', 'risk_level',
      'returns_1y', 'returns_3y', 'returns_5y',
      'min_lumpsum', 'min_sip', 'fund_manager',
      'investment_objective', 'fund_start_date',
      'detail_info_synced_at'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(data[field]);
      }
    }

    if (fields.length === 0) return { affectedRows: 0 };

    // Update timestamp
    fields.push('updated_at = ?');
    values.push(Date.now());

    // Where clause
    values.push(schemeCode);

    const query = `UPDATE funds SET ${fields.join(', ')} WHERE scheme_code = ?`;
    return db.run(query, values);
  },

  /**
   * Find funds without recent NAV updates (inactive fund detection)
   * @param {number} days - Number of days without NAV update
   * @returns {Promise<Array>} Array of scheme_codes
   */
  async findFundsWithoutRecentNav(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const query = `
      SELECT f.scheme_code, f.scheme_name, f.fund_house, 
             MAX(h.nav_date) as last_nav_date
      FROM funds f
      LEFT JOIN fund_nav_history h ON f.scheme_code = h.scheme_code
      WHERE f.is_active = true
      GROUP BY f.scheme_code, f.scheme_name, f.fund_house
      HAVING last_nav_date IS NULL OR last_nav_date < ?
    `;

    return db.query(query, [cutoffDateStr]);
  },

  /**
   * Find funds that have ANY useful data (AUM, Manager, Returns, etc.)
   * Used as sources for peer enrichment.
   */
  async findEnrichedFunds() {
    // We look for funds that have at least ONE important field populated
    const query = `
      SELECT * FROM funds 
      WHERE is_active = true 
      AND (
        aum IS NOT NULL OR 
        expense_ratio IS NOT NULL OR 
        risk_level IS NOT NULL OR 
        fund_manager IS NOT NULL OR 
        returns_1y IS NOT NULL OR 
        fund_start_date IS NOT NULL
      )
    `;
    const rows = await db.query(query);
    return rows;
  },

  /**
   * Find peer funds with matching base name that are missing ANY data.
   * @param {string} baseName - The base name to match (e.g. "HDFC Top 100")
   * @param {number} excludeCode - The source scheme code to exclude
   */
  async findPeerFundsMissingData(baseName, excludeCode) {
    // We want funds where at least one field is NULL so we can fill it
    const query = `
      SELECT * FROM funds 
      WHERE scheme_name LIKE ? 
      AND scheme_code != ?
      AND is_active = true
      AND (
        aum IS NULL OR 
        expense_ratio IS NULL OR 
        risk_level IS NULL OR 
        fund_manager IS NULL OR 
        returns_1y IS NULL OR 
        fund_start_date IS NULL
      )
    `;
    const rows = await db.query(query, [`${baseName}%`, excludeCode]);
    return rows;
  },

  /**
   * Find a peer fund with matching base name that HAS data.
   * Used as a fallback and for exact name matching.
   * @param {string} baseName - Exact base name to match
   * @param {number} excludeCode - Current fund to exclude
   */
  async findPeerFundWithData(baseName, excludeCode) {
    return await db.queryOne(
      `SELECT * FROM funds 
       WHERE scheme_name LIKE ? 
       AND scheme_code != ?
       AND aum IS NOT NULL 
       AND is_active = true
       LIMIT 1`,
      [`${baseName}%`, excludeCode]
    );
  },

  /**
   * Get all active scheme codes for NAV sync
   * @returns {Promise<Array>} Array of scheme codes
   */
  async getActiveSchemeCodesForSync() {
    const rows = await db.query('SELECT scheme_code FROM funds WHERE is_active = true');
    return rows.map(r => r.scheme_code);
  }
};
