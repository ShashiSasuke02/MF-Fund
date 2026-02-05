import logger from './logger.service.js';
import { fundModel } from '../models/fund.model.js';
import { fundNavHistoryModel } from '../models/fundNavHistory.model.js';

/**
 * AMFI Text-based NAV Sync Service
 * Downloads and parses the official AMFI NAV text file for bulk updates.
 * 
 * Source: https://portal.amfiindia.com/spages/NAVAll.txt
 * Format: Semicolon-delimited (;)
 * Columns: Scheme Code; ISIN Div Payout/Growth; ISIN Div Reinvestment; Scheme Name; Net Asset Value; Date
 */

const AMFI_NAV_URL = 'https://portal.amfiindia.com/spages/NAVAll.txt';

// Month abbreviation mapping for date parsing (DD-MMM-YYYY)
const MONTH_MAP = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
};

export const amfiSyncService = {
    /**
     * Download the AMFI NAV text file
     * @returns {Promise<string>} Raw text content
     */
    async fetchNavFile() {
        logger.info('[AMFI Sync] Downloading NAVAll.txt...');
        const startTime = Date.now();

        const response = await fetch(AMFI_NAV_URL);
        if (!response.ok) {
            throw new Error(`Failed to download AMFI file: ${response.status} ${response.statusText}`);
        }

        const text = await response.text();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logger.info(`[AMFI Sync] Downloaded ${(text.length / 1024).toFixed(2)} KB in ${duration}s`);

        return text;
    },

    /**
     * Parse date from AMFI format (DD-MMM-YYYY) to DB format (YYYY-MM-DD)
     * @param {string} dateStr - e.g., "04-Feb-2026"
     * @returns {string|null} - e.g., "2026-02-04"
     */
    parseAmfiDate(dateStr) {
        if (!dateStr) return null;

        const parts = dateStr.trim().split('-');
        if (parts.length !== 3) return null;

        const day = parts[0].padStart(2, '0');
        const month = MONTH_MAP[parts[1]];
        const year = parts[2];

        if (!month) return null;

        return `${year}-${month}-${day}`;
    },

    /**
     * Parse the AMFI text file and extract NAV data
     * @param {string} rawText - Raw file content
     * @returns {Array<Object>} Parsed fund NAV records
     */
    parseNavFile(rawText) {
        const lines = rawText.split('\n');
        const records = [];

        for (const line of lines) {
            // Skip empty lines and headers (lines without semicolons or scheme codes)
            if (!line.includes(';')) continue;

            const parts = line.split(';');
            // Expected: SchemeCode; ISIN1; ISIN2; SchemeName; NAV; Date
            if (parts.length < 5) continue;

            const schemeCode = parseInt(parts[0].trim(), 10);
            if (isNaN(schemeCode)) continue; // Skip non-numeric (header rows)

            const navStr = parts[4].trim();
            const nav = parseFloat(navStr);
            if (isNaN(nav) || nav <= 0) continue;

            const dateStr = parts[5]?.trim();
            const navDate = this.parseAmfiDate(dateStr);
            if (!navDate) continue;

            records.push({
                schemeCode,
                schemeName: parts[3].trim(),
                nav,
                navDate
            });
        }

        return records;
    },

    /**
     * Main sync function - Downloads, parses, and updates database
     * @param {boolean} dryRun - If true, only analyze without DB writes
     * @returns {Object} Sync result statistics
     */
    async runSync(dryRun = false) {
        const stats = {
            totalParsed: 0,
            matchedFunds: 0,
            navUpdated: 0,
            skippedNoMatch: 0,
            errors: 0,
            dryRun
        };

        try {
            // Step 1: Download file
            const rawText = await this.fetchNavFile();

            // Step 2: Parse
            logger.info('[AMFI Sync] Parsing NAV data...');
            const allRecords = this.parseNavFile(rawText);
            stats.totalParsed = allRecords.length;
            logger.info(`[AMFI Sync] Parsed ${stats.totalParsed} NAV records from AMFI file`);

            // Step 3: Get tracked scheme codes from our database
            logger.info('[AMFI Sync] Loading tracked scheme codes from database...');
            const trackedCodes = await fundModel.getActiveSchemeCodesForSync();
            const trackedSet = new Set(trackedCodes);
            logger.info(`[AMFI Sync] Tracking ${trackedCodes.length} active funds in database`);

            // Step 4: Filter to only tracked funds
            const matchedRecords = allRecords.filter(r => trackedSet.has(r.schemeCode));
            stats.matchedFunds = matchedRecords.length;
            stats.skippedNoMatch = stats.totalParsed - stats.matchedFunds;
            logger.info(`[AMFI Sync] Matched ${stats.matchedFunds} funds (Skipped: ${stats.skippedNoMatch})`);

            // Step 5: Update database (or skip if dry run)
            if (dryRun) {
                logger.info('[AMFI Sync] DRY RUN - Skipping database updates');
                // Sample output for verification
                logger.info('[AMFI Sync] Sample of matched records:');
                matchedRecords.slice(0, 5).forEach(r => {
                    logger.info(`  - ${r.schemeCode}: ₹${r.nav} on ${r.navDate}`);
                });
            } else {
                logger.info('[AMFI Sync] Upserting NAV records to database...');
                const batchSize = 100;
                const totalBatches = Math.ceil(matchedRecords.length / batchSize);

                for (let i = 0; i < matchedRecords.length; i += batchSize) {
                    const batch = matchedRecords.slice(i, i + batchSize);
                    const batchNum = Math.floor(i / batchSize) + 1;

                    for (const record of batch) {
                        try {
                            await fundNavHistoryModel.upsertNavRecord(
                                record.schemeCode,
                                record.navDate,
                                record.nav
                            );
                            stats.navUpdated++;
                        } catch (err) {
                            stats.errors++;
                            logger.error(`[AMFI Sync] Failed to update ${record.schemeCode}: ${err.message}`);
                        }
                    }

                    logger.info(`[AMFI Sync] Batch ${batchNum}/${totalBatches}: ${stats.navUpdated}/${stats.matchedFunds} updated`);
                }
            }

            logger.info('[AMFI Sync] Sync complete!');
            logger.info(`[AMFI Sync] Summary: ${JSON.stringify(stats)}`);

            return { success: true, ...stats };

        } catch (error) {
            logger.error(`[AMFI Sync] Sync failed: ${error.message}`);
            return { success: false, error: error.message, ...stats };
        }
    },

    /**
     * Dry run analysis - Downloads and parses without any DB changes
     * Useful for testing the parser and seeing coverage
     * @returns {Object} Analysis result
     */
    async analyzeSync() {
        return this.runSync(true);
    }
};
