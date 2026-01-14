import { query, queryOne, run } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const demoAccountModel = {
  /**
   * Get demo account by user ID
   */
  findByUserId(userId) {
    return queryOne(
      `SELECT id, user_id, balance, created_at, updated_at 
       FROM demo_accounts WHERE user_id = ?`,
      [userId]
    );
  },

  /**
   * Update demo account balance (system only - called by transaction service)
   */
  updateBalance(userId, newBalance) {
    run(
      `UPDATE demo_accounts 
       SET balance = ?, updated_at = ? 
       WHERE user_id = ?`,
      [newBalance, Date.now(), userId]
    );
    saveDatabase();
  },

  /**
   * Get current balance
   */
  getBalance(userId) {
    const account = this.findByUserId(userId);
    return account ? account.balance : null;
  }
};
