import { query, queryOne, run } from '../db/database.js';

/**
 * AMC Model - handles database operations for AMC master data
 */
class AmcModel {
  /**
   * Get all AMCs ordered by display_order
   * @returns {Array} - List of AMC records
   */
  async getAll() {
    return await query(`
      SELECT fund_house, display_name, display_order, logo_url, created_at
      FROM amc_master
      ORDER BY display_order ASC
    `);
  }

  /**
   * Get AMC by fund house name
   * @param {string} fundHouse - Fund house identifier
   * @returns {object|null} - AMC record or null
   */
  async getByFundHouse(fundHouse) {
    return await queryOne(`
      SELECT fund_house, display_name, display_order, logo_url, created_at
      FROM amc_master
      WHERE fund_house = ?
    `, [fundHouse]);
  }

  /**
   * Check if fund house exists
   * @param {string} fundHouse - Fund house identifier
   * @returns {boolean}
   */
  async exists(fundHouse) {
    const result = await queryOne('SELECT 1 as found FROM amc_master WHERE fund_house = ?', [fundHouse]);
    return !!result;
  }

  /**
   * Add new AMC
   * @param {object} amc - AMC data
   * @returns {object} - Result info
   */
  async create(amc) {
    return await run(`
      INSERT INTO amc_master (fund_house, display_name, display_order, logo_url)
      VALUES (?, ?, ?, ?)
    `, [
      amc.fundHouse,
      amc.displayName || amc.fundHouse,
      amc.displayOrder || 0,
      amc.logoUrl || null
    ]);
  }

  /**
   * Update AMC
   * @param {string} fundHouse - Fund house identifier
   * @param {object} updates - Fields to update
   * @returns {object} - Result info
   */
  async update(fundHouse, updates) {
    const fields = [];
    const values = [];

    if (updates.displayName !== undefined) {
      fields.push('display_name = ?');
      values.push(updates.displayName);
    }
    if (updates.displayOrder !== undefined) {
      fields.push('display_order = ?');
      values.push(updates.displayOrder);
    }
    if (updates.logoUrl !== undefined) {
      fields.push('logo_url = ?');
      values.push(updates.logoUrl);
    }

    if (fields.length === 0) {
      return { changes: 0 };
    }

    values.push(fundHouse);
    return await run(`
      UPDATE amc_master
      SET ${fields.join(', ')}
      WHERE fund_house = ?
    `, values);
  }

  /**
   * Delete AMC
   * @param {string} fundHouse - Fund house identifier
   * @returns {object} - Result info
   */
  async delete(fundHouse) {
    return await run('DELETE FROM amc_master WHERE fund_house = ?', [fundHouse]);
  }
}

export const amcModel = new AmcModel();
export default amcModel;
