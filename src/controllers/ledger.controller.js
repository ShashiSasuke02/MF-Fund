import ledgerService from '../services/ledger.service.js';
import logger from '../services/logger.service.js';

class LedgerController {
    /**
     * Get ledger entries for the authenticated user.
     * @param {Object} req - Express request object.
     * @param {Object} res - Express response object.
     */
    async getLedger(req, res, next) {
        try {
            const userId = req.user.userId;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            logger.info(`[LedgerController] Get ledger request`, { userId, page, limit });

            const result = await ledgerService.getUserLedger(userId, page, limit);
            res.json({ success: true, ...result });
        } catch (error) {
            logger.error(`[LedgerController] Error fetching ledger`, { error });
            next(error);
        }
    }
}

export default new LedgerController();
