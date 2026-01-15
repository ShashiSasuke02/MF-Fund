import { query, queryOne, run } from '../db/database.js';
import { saveDatabase } from '../db/database.js';

export const demoAccountModel = {
  /**
   * Get demo account by user ID
   */
  async findByUserId(userId) {
    return await queryOne(
      `SELECT id, user_id, balance, created_at, updated_at 
       FROM demo_accounts WHERE user_id = ?`,
      [userId]
    );
  },

  /**
   * Update demo account balance (system only - called by transaction service)
   */
  async updateBalance(userId, newBalance) {
    await run(
      `UPDATE demo_accounts 
       SET balance = ?, updated_at = ? 
       WHERE user_id = ?`,
      [newBalance, Date.now(), userId]
    );
  },

  /**
   * Get current balance
   */
  async getBalance(userId) {
    const account = await this.findByUserId(userId);
    return account ? account.balance : null;
  }
};
