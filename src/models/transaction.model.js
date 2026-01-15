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
    const result = await run(
      `INSERT INTO transactions 
       (user_id, scheme_code, scheme_name, transaction_type, amount, units, nav, 
        frequency, start_date, end_date, installments, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, schemeCode, schemeName, transactionType, amount, units, nav,
       frequency, startDate, endDate, installments, status]
    );
    
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
  async findByUserId(userId, limit = 50, offset = 0) {
    // Convert to integers to prevent SQL injection
    const safeLimit = parseInt(limit) || 50;
    const safeOffset = parseInt(offset) || 0;
    
    const results = await query(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       ORDER BY executed_at DESC 
       LIMIT ${safeLimit} OFFSET ${safeOffset}`,
      [userId]
    );
    return results;
  },

  /**
   * Get transaction by ID
   */
  async findById(id) {
    return await queryOne(
      `SELECT * FROM transactions WHERE id = ?`,
      [id]
    );
  },

  /**
   * Get transactions by scheme
   */
  async findByScheme(userId, schemeCode) {
    return await query(
      `SELECT * FROM transactions 
       WHERE user_id = ? AND scheme_code = ? 
       ORDER BY executed_at DESC`,
      [userId, schemeCode]
    );
  },

  /**
   * Get transaction count by user
   */
  async countByUserId(userId) {
    const result = await queryOne(
      `SELECT COUNT(*) as count FROM transactions WHERE user_id = ?`,
      [userId]
    );
    return result ? result.count : 0;
  },

  /**
   * Update transaction status
   */
  async updateStatus(id, status) {
    await run(
      `UPDATE transactions SET status = ? WHERE id = ?`,
      [status, id]
    );
  },

  /**
   * Get active systematic plans (SIP, STP, SWP) for a user
   */
  async findActiveSystematicPlans(userId) {
    console.log('[Transaction Model] findActiveSystematicPlans - userId:', userId);
    const results = await query(
      `SELECT * FROM transactions 
       WHERE user_id = ? 
       AND transaction_type IN ('SIP', 'STP', 'SWP')
       AND status = 'SUCCESS'
       ORDER BY transaction_type, executed_at DESC`,
      [userId]
    );
    console.log('[Transaction Model] Found', results.length, 'active systematic plans for userId:', userId);
    return results;
  }
};
