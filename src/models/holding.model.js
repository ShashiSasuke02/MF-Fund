import { query, queryOne, run } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const holdingModel = {
  /**
   * Create or update holding
   */
  async upsert({ userId, schemeCode, schemeName, units, investedAmount, currentValue, lastNav, lastNavDate }) {
    const existing = this.findByScheme(userId, schemeCode);
    
    if (existing) {
      // Update existing holding
      run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, current_value = ?, 
             last_nav = ?, last_nav_date = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [units, investedAmount, currentValue, lastNav, lastNavDate, Date.now(), userId, schemeCode]
      );
      saveDatabase();
      return this.findByScheme(userId, schemeCode);
    } else {
      // Insert new holding
      const result = run(
        `INSERT INTO holdings 
         (user_id, scheme_code, scheme_name, total_units, invested_amount, 
          current_value, last_nav, last_nav_date) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, schemeCode, schemeName, units, investedAmount, currentValue, lastNav, lastNavDate]
      );
      
      saveDatabase();
      return this.findById(result.lastInsertRowid);
    }
  },

  /**
   * Get all holdings for a user
   */
  findByUserId(userId) {
    return query(
      `SELECT * FROM holdings 
       WHERE user_id = ? 
       ORDER BY invested_amount DESC`,
      [userId]
    );
  },

  /**
   * Get holding by scheme
   */
  findByScheme(userId, schemeCode) {
    return queryOne(
      `SELECT * FROM holdings 
       WHERE user_id = ? AND scheme_code = ?`,
      [userId, schemeCode]
    );
  },

  /**
   * Get holding by ID
   */
  findById(id) {
    return queryOne(
      `SELECT * FROM holdings WHERE id = ?`,
      [id]
    );
  },

  /**
   * Add units to holding
   */
  addUnits(userId, schemeCode, units, amount) {
    const holding = this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const newUnits = holding.total_units + units;
      const newInvestedAmount = holding.invested_amount + amount;
      
      run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [newUnits, newInvestedAmount, Date.now(), userId, schemeCode]
      );
      saveDatabase();
    }
  },

  /**
   * Remove units from holding
   */
  removeUnits(userId, schemeCode, units, amount) {
    const holding = this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const newUnits = Math.max(0, holding.total_units - units);
      const newInvestedAmount = Math.max(0, holding.invested_amount - amount);
      
      run(
        `UPDATE holdings 
         SET total_units = ?, invested_amount = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [newUnits, newInvestedAmount, Date.now(), userId, schemeCode]
      );
      
      // Delete holding if no units remain
      if (newUnits === 0) {
        run(
          `DELETE FROM holdings WHERE user_id = ? AND scheme_code = ?`,
          [userId, schemeCode]
        );
      }
      
      saveDatabase();
    }
  },

  /**
   * Update current values from NAV
   */
  updateCurrentValue(userId, schemeCode, currentNav, navDate) {
    const holding = this.findByScheme(userId, schemeCode);
    
    if (holding) {
      const currentValue = holding.total_units * currentNav;
      
      run(
        `UPDATE holdings 
         SET current_value = ?, last_nav = ?, last_nav_date = ?, updated_at = ? 
         WHERE user_id = ? AND scheme_code = ?`,
        [currentValue, currentNav, navDate, Date.now(), userId, schemeCode]
      );
      saveDatabase();
    }
  }
};
