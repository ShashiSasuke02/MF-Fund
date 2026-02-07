import pool from '../db/database.js';
import logger from '../services/logger.service.js';

class LedgerModel {
    /**
     * Create a new ledger entry.
     * @param {Object} entry - The ledger entry object.
     * @param {number} entry.userId - User ID.
     * @param {number|null} entry.transactionId - Transaction ID (optional).
     * @param {number} entry.amount - Amount (positive for credit, negative for debit? No, amount is absolute, type defines direction).
     * @param {number} entry.balanceAfter - Balance after transaction.
     * @param {string} entry.type - 'CREDIT' or 'DEBIT'.
     * @param {string} entry.description - Description.
     * @returns {Promise<number>} - Insert ID.
     */
    static async createEntry({ userId, transactionId, amount, balanceAfter, type, description }) {
        const query = `
            INSERT INTO ledger_entries (user_id, transaction_id, amount, balance_after, type, description)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const values = [userId, transactionId, amount, balanceAfter, type, description];

        try {
            const result = await pool.run(query, values);
            logger.info(`[LedgerModel] Entry created. ID: ${result.insertId}`, { userId, type, amount });
            return result.insertId;
        } catch (error) {
            logger.error(`[LedgerModel] Error creating entry: ${error.message}`, { userId, error });
            throw error;
        }
    }

    /**
     * Get ledger entries by user ID with pagination.
     * @param {number} userId - User ID.
     * @param {number} limit - Limit.
     * @param {number} offset - Offset.
     * @returns {Promise<{entries: Array, total: number}>} - Entries and total count.
     */
    static async getEntriesByUser(userId, limit = 20, offset = 0) {
        const query = `
            SELECT id, user_id, transaction_id, amount, balance_after, type, description, created_at
            FROM ledger_entries
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `;
        const countQuery = `SELECT COUNT(*) as total FROM ledger_entries WHERE user_id = ?`;

        try {
            const entries = await pool.query(query, [userId, limit, offset]);
            const countResult = await pool.query(countQuery, [userId]);
            return {
                entries,
                total: countResult[0]?.total || 0
            };
        } catch (error) {
            logger.error(`[LedgerModel] Error fetching entries: ${error.message}`, { userId, error });
            throw error;
        }
    }
}

export default LedgerModel;
