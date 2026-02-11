import { fundModel } from '../models/fund.model.js';
import { extractBaseName } from '../utils/fund.utils.js';
import { extractBaseName } from '../utils/fund.utils.js';
import { cronNotificationService } from './cronNotification.service.js';
import logger from './logger.service.js';
import db from '../db/database.js';

export const peerEnrichmentService = {
    /**
     * Run Daily Peer Enrichment Job
     * Copies AUM, Expense, Risk, etc. from "Rich" funds to "Poor" peer funds.
     */
    async runDailyEnrichment() {
        logger.info('[Peer Enrichment] Starting daily enrichment job...');
        const startTime = Date.now();
        const stats = {
            sourceFundsFound: 0,
            targetsUpdated: 0,
            errors: 0
        };

        try {
            // 1. Find "Source" Funds (Funds with full data)
            // We look for funds that have AUM and Manager (indicators of good data)
            const sourceFunds = await fundModel.findEnrichedFunds();
            stats.sourceFundsFound = sourceFunds.length;

            logger.info(`[Peer Enrichment] Found ${sourceFunds.length} potential source funds.`);

            for (const source of sourceFunds) {
                try {
                    // 2. Extract Base Name (e.g., "HDFC Top 100 Fund - Direct Plan - Growth Option")
                    // Logic: Take everything before " - Direct" or " - Regular"
                    const baseName = this.extractBaseName(source.scheme_name);

                    if (!baseName || baseName.length < 5) continue;

                    // 3. Find "Target" Peers (Same base name, but missing data)
                    // We only update funds where AUM is NULL (don't overwrite existing data)
                    const targets = await fundModel.findPeerFundsMissingData(baseName, source.scheme_code);

                    for (const target of targets) {
                        // 4. Copy Data
                        const updated = await this.copyFundData(source, target);
                        if (updated) {
                            stats.targetsUpdated++;
                            totalEnriched++;
                            enrichedFundNames.push(target.scheme_name);
                            // Detailed log as requested
                            logger.debug(`[Peer Enrichment] Updated Peer: ${target.scheme_name} (from Source: ${source.scheme_name})`);
                        }
                    }
                } catch (err) {
                    stats.errors++;
                    logger.error(`[Peer Enrichment] Error processing source ${source.scheme_code}: ${err.message}`);
                }
            }

            logger.info(`[Peer Enrichment] Job complete. Updated ${stats.targetsUpdated} funds using ${stats.sourceFundsFound} sources.`);

            // Calculate duration
            const duration = Date.now() - startTime;

            // Send Email Notification
            await cronNotificationService.onJobComplete(
                'Peer Fund Enrichment',
                'SUCCESS',
                { totalEnriched, enrichedFundNames },
                null, // No failure error
                duration
            );

            return { success: true, totalEnriched, enrichedFundNames };

        } catch (error) {
            logger.error('[Peer Enrichment] Critical job failure:', error);

            // Send Email Notification (Failure)
            await cronNotificationService.onJobComplete(
                'Peer Fund Enrichment',
                'FAILED',
                { totalEnriched, enrichedFundNames },
                error.message,
                Date.now() - startTime
            );

            throw error;
        }
    },

    /**
        return base.trim();
    },

    /**
     * Copy data from source to target in DB using Partial Fill (COALESCE).
     * Only fills missing fields, never overwrites existing data.
     */
    async copyFundData(source, target) {
        // Safe Update Logic: SET column = COALESCE(column, new_value)
        // This means: "Keep the existing value if it exists; otherwise use the new value."
        const query = `
      UPDATE funds 
      SET aum = COALESCE(aum, ?), 
          risk_level = COALESCE(risk_level, ?), 
          fund_manager = COALESCE(fund_manager, ?), 
          returns_1y = COALESCE(returns_1y, ?),
          returns_3y = COALESCE(returns_3y, ?),
          returns_5y = COALESCE(returns_5y, ?),
          min_sip = COALESCE(min_sip, ?),
          min_lumpsum = COALESCE(min_lumpsum, ?),
          expense_ratio = COALESCE(expense_ratio, ?), 
          investment_objective = COALESCE(investment_objective, ?),
          fund_start_date = COALESCE(fund_start_date, ?)
      WHERE scheme_code = ?
    `;

        await db.run(query, [
            source.aum,
            source.risk_level,
            source.fund_manager,
            source.returns_1y,
            source.returns_3y,
            source.returns_5y,
            source.min_sip,
            source.min_lumpsum,
            source.expense_ratio,
            source.investment_objective,
            source.fund_start_date,
            target.scheme_code
        ]);
    }
};
