import { query, queryOne, run } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const holdingModel = {
  /**
   * Create or update holding
   */
  async upsert({ userId, schemeCode, schemeName, units, investedAmount, currentValue, lastNav, lastNavDate }) {
    const existing = await this.findByScheme(userId, schemeCode);
    
    if (existing) {
      // Update existing holding
      await run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, current_value = ?, 
             last_nav = ?, last_nav_date = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [units, investedAmount, currentValue, lastNav, lastNavDate, Date.now(), userId, schemeCode]
      );
      return await this.findByScheme(userId, schemeCode);
    } else {
      // Insert new holding
      const result = await run(
        `INSERT INTO holdings 
         (user_id, scheme_code, scheme_name, total_units, invested_amount, 
          current_value, last_nav, last_nav_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, schemeCode, schemeName, units, investedAmount, currentValue, lastNav, lastNavDate]
      );
      
      return await this.findById(result.lastInsertRowid);
    }
  },

  /**
   * Get all holdings for a user
   */
  async findByUserId(userId) {
    console.log('[Holding Model] findByUserId - userId:', userId);
    const results = await query(
      `SELECT * FROM holdings 
       WHERE user_id = ? 
       ORDER BY invested_amount DESC`,
      [userId]
    );
    console.log('[Holding Model] Query returned', results.length, 'holdings for userId:', userId);
    if (results.length > 0) {
      console.log('[Holding Model] First holding user_id:', results[0].user_id);
    }
    return results;
  },

  /**
   * Get holding by scheme
   */
  async findByScheme(userId, schemeCode) {
    return await queryOne(
      `SELECT * FROM holdings 
       WHERE user_id = ? AND scheme_code = ?`,
      [userId, schemeCode]
    );
  },

  /**
   * Get holding by ID
   */
  async findById(id) {
    return await queryOne(
      `SELECT * FROM holdings WHERE id = ?`,
      [id]
    );
  },

  /**
   * Add units to holding
   */
  async addUnits(userId, schemeCode, units, amount) {
    const holding = await this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const newUnits = holding.total_units + units;
      const newInvestedAmount = holding.invested_amount + amount;
      
      await run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [newUnits, newInvestedAmount, Date.now(), userId, schemeCode]
      );
    }
  },

  /**
   * Remove units from holding
   */
  async removeUnits(userId, schemeCode, units, amount) {
    const holding = await this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const newUnits = Math.max(0, holding.total_units - units);
      const newInvestedAmount = Math.max(0, holding.invested_amount - amount);
      
      await run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [newUnits, newInvestedAmount, Date.now(), userId, schemeCode]
      );
      
      // Delete holding if no units remain
      if (newUnits === 0) {
        await run(
          `DELETE FROM holdings WHERE user_id = ? AND scheme_code = ?`,
          [userId, schemeCode]
        );
      }
    }
  },

  /**
   * Update current values from NAV
   */
  async updateCurrentValue(userId, schemeCode, currentNav, navDate) {
    const holding = await this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const currentValue = holding.total_units * currentNav;
      
      await run(
        `UPDATE holdings 
         SET current_value = ?, last_nav = ?, last_nav_date = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [currentValue, currentNav, navDate, Date.now(), userId, schemeCode]
      );
    }
  }
};
