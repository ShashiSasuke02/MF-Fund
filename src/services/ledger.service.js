import LedgerModel from '../models/ledger.model.js';
import logger from './logger.service.js';

class LedgerService {
    /**
     * Get ledger entries for a user.
     * @param {number} userId - User ID.
     * @param {number} page - Page number (1-based).
     * @param {number} limit - Items per page.
     * @returns {Promise<Object>} - Entries and pagination info.
     */
    async getUserLedger(userId, page = 1, limit = 20) {
        try {
            const offset = (page - 1) * limit;
            const { entries, total } = await LedgerModel.getEntriesByUser(userId, limit, offset);

            logger.info(`[LedgerService] Fetched ledger entries for user ${userId}`, { page, limit, count: entries.length });

            return {
                data: entries,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit)
                }
            };
        } catch (error) {
            logger.error(`[LedgerService] Error getting user ledger: ${error.message}`, { userId, error });
            throw error;
        }
    }
}

export default new LedgerService();
