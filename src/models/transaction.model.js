import { query, queryOne, run } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const transactionModel = {
  /**
   * Create a new transaction
   */
  async create({
    userId,
    schemeCode,
    schemeName,
    transactionType,
    amount,
    units,
    nav,
    frequency,
    startDate,
    endDate,
    installments,
    status = 'SUCCESS'
  }) {
    const result = run(
      `INSERT INTO transactions 
       (user_id, scheme_code, scheme_name, transaction_type, amount, units, nav, 
        frequency, start_date, end_date, installments, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, schemeCode, schemeName, transactionType, amount, units, nav,
       frequency, startDate, endDate, installments, status]
    );
    
    saveDatabase();
    
    return {
      id: result.lastInsertRowid,
      userId,
      schemeCode,
      schemeName,
      transactionType,
      amount,
      units,
      nav,
      frequency,
      startDate,
      endDate,
      installments,
      status
    };
  },

  /**
   * Get all transactions for a user
   */
  findByUserId(userId, limit = 50, offset = 0) {
    return query(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY executed_at DESC 
       LIMIT ? OFFSET ?`,
      [userId, limit, offset]
    );
  },

  /**
   * Get transaction by ID
   */
  findById(id) {
    return queryOne(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );
  },

  /**
   * Get transactions by scheme
   */
  findByScheme(userId, schemeCode) {
    return query(
      `SELECT * FROM transactions 
       WHERE user_id = ? AND scheme_code = ? 
       ORDER BY executed_at DESC`,
      [userId, schemeCode]
    );
  },

  /**
   * Get transaction count by user
   */
  countByUserId(userId) {
    const result = queryOne(
      `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`,
      [userId]
    );
    return result ? result.count : 0;
  },

  /**
   * Update transaction status
   */
  updateStatus(id, status) {
    run(
      `UPDATE transactions SET status = ? WHERE id = ?`,
      [status, id]
    );
    saveDatabase();
  }
};
