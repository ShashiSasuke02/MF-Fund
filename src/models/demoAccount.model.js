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
  },

  /**
   * Create default demo account for user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} - Created account
   */
  async createDefault(userId) {
    const INITIAL_BALANCE = 10000000.00;

    // Create account
    await run(
      `INSERT INTO demo_accounts (user_id, balance) VALUES (?, ?)`,
      [userId, INITIAL_BALANCE]
    );

    // Create ledger entry for opening balance
    // Lazy import or circular dependency handling if needed, but LedgerModel is separate
    try {
      const { default: LedgerModel } = await import('./ledger.model.js');
      await LedgerModel.createEntry({
        userId,
        transactionId: null, // No transaction ID for opening balance
        amount: INITIAL_BALANCE,
        balanceAfter: INITIAL_BALANCE,
        type: 'CREDIT',
        description: 'Opening Balance'
      });
    } catch (error) {
      console.error('[DemoAccountModel] Failed to create opening balance ledger entry:', error);
      // Proceed without failing the whole account creation, but warn
    }

    return await this.findByUserId(userId);
  }
};
