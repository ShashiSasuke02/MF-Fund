import { mfApiService } from './mfapi.service.js';
import { fundModel } from '../models/fund.model.js';
import { fundNavHistoryModel } from '../models/fundNavHistory.model.js';
import { fundSyncLogModel } from '../models/fundSyncLog.model.js';

/**
 * MFAPI Ingestion Service
 * Handles nightly data ingestion from MFAPI to MySQL for 10 major AMCs
 */

// 10 AMC Whitelist - ~60% of India's mutual fund AUM
const AMC_WHITELIST = [
  'SBI',
  'ICICI Prudential',
  'HDFC',
  'Nippon India',
  'Kotak Mahindra',
  'Aditya Birla Sun Life',
  'UTI',
  'Axis',
  'Tata',
  'Mirae Asset'
];

const NAV_RETENTION_COUNT = 30; // Keep latest 30 NAV records per fund
const BATCH_SIZE = parseInt(process.env.MFAPI_BATCH_SIZE) || 10; // Reduced to prevent DB connection pool exhaustion
const RATE_LIMIT_DELAY = 1000; // 1s delay between batches for connection cleanup

export const mfapiIngestionService = {
  /**
   * Full sync: Fetch all funds from 10 AMCs + latest NAV
   * Run this at 2:00 AM IST daily
   */
  async runFullSync() {
    let syncId;
    const stats = {
      totalFetched: 0,
      inserted: 0,
      updated: 0,
      navInserted: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      console.log('[MFAPI Ingestion] Starting full sync for 10 AMCs...');
      syncId = await fundSyncLogModel.startSync('FULL');

      // Step 1: Fetch all funds from MFAPI
      console.log('[MFAPI Ingestion] Fetching all funds from MFAPI...');
      const allFunds = await this.fetchAllFunds();
      console.log(`[MFAPI Ingestion] Total funds fetched from MFAPI: ${allFunds.length}`);

      // Step 2: Filter by AMC whitelist
      const whitelistedFunds = this.filterByWhitelist(allFunds);
      console.log(`[MFAPI Ingestion] Whitelisted funds (10 AMCs): ${whitelistedFunds.length}`);
      stats.totalFetched = whitelistedFunds.length;

      // Step 3: Upsert funds to database (BATCH PROCESSING)
      console.log('[MFAPI Ingestion] Upserting funds to database...');
      const upsertStartTime = Date.now();

      // Reduced batch size to avoid MySQL max_allowed_packet issues
      const FUND_UPSERT_BATCH_SIZE = 100;
      const totalBatches = Math.ceil(whitelistedFunds.length / FUND_UPSERT_BATCH_SIZE);

      for (let i = 0; i < whitelistedFunds.length; i += FUND_UPSERT_BATCH_SIZE) {
        const batch = whitelistedFunds.slice(i, i + FUND_UPSERT_BATCH_SIZE);
        const batchNum = Math.floor(i / FUND_UPSERT_BATCH_SIZE) + 1;

        try {
          // Transform batch
          const transformedBatch = batch.map(fund => this.transformFundData(fund));

          // Bulk Upsert
          await fundModel.bulkUpsertFunds(transformedBatch);

          stats.inserted += batch.length;
          console.log(`[MFAPI Ingestion] Fund upsert batch ${batchNum}/${totalBatches}: ${stats.inserted}/${whitelistedFunds.length} funds`);
        } catch (error) {
          console.error(`[MFAPI Ingestion] Batch ${batchNum} failed:`, error.message);
          console.log(`[MFAPI Ingestion] Falling back to sequential upsert for batch ${batchNum}...`);
          // Fallback to sequential upsert for this batch to save what we can
          for (const fund of batch) {
            try {
              await fundModel.upsertFund(this.transformFundData(fund));
              stats.inserted++;
            } catch (innerErr) {
              stats.errors++;
              stats.errorDetails.push({ schemeCode: fund.schemeCode, error: innerErr.message });
            }
          }
          console.log(`[MFAPI Ingestion] Batch ${batchNum} sequential fallback complete`);
        }
      }

      const upsertDuration = ((Date.now() - upsertStartTime) / 1000).toFixed(2);
      console.log(`[MFAPI Ingestion] Fund upsert complete in ${upsertDuration}s. Success: ${stats.inserted}, Errors: ${stats.errors}`);

      console.log(`[MFAPI Ingestion] Funds upserted: ${stats.inserted}, Errors: ${stats.errors}`);

      // Step 4: Fetch NAV for each fund (batch processing)
      console.log('[MFAPI Ingestion] Fetching NAV data...');
      const schemeCodes = whitelistedFunds.map(f => f.schemeCode);
      await this.batchFetchNavs(schemeCodes, stats);

      console.log(`[MFAPI Ingestion] NAV records inserted: ${stats.navInserted}`);

      // Step 5: Complete sync
      await fundSyncLogModel.completeSyncSuccess(syncId, stats);

      const summary = {
        success: true,
        syncId,
        ...stats,
        errorSummary: stats.errorDetails.slice(0, 10) // First 10 errors
      };

      console.log('[MFAPI Ingestion] Full sync completed successfully');
      console.log('[MFAPI Ingestion] Summary:', JSON.stringify(summary, null, 2));

      return summary;
    } catch (error) {
      console.error('[MFAPI Ingestion] Full sync failed:', error);

      if (syncId) {
        await fundSyncLogModel.completeSyncFailure(syncId, error);
      }

      return {
        success: false,
        error: error.message,
        stack: error.stack,
        ...stats
      };
    }
  },

  /**
   * Incremental sync: Update NAV only for existing active funds
   * Optional: Run during market hours for fresher data
   */
  async runIncrementalSync() {
    let syncId;
    const stats = {
      totalFetched: 0,
      navInserted: 0,
      errors: 0,
      errorDetails: []
    };

    try {
      console.log('[MFAPI Ingestion] Starting incremental NAV sync...');
      syncId = await fundSyncLogModel.startSync('INCREMENTAL');

      // Get all active funds from database
      const activeFunds = await fundModel.getAllActiveFunds();
      stats.totalFetched = activeFunds.length;
      console.log(`[MFAPI Ingestion] Active funds in database: ${activeFunds.length}`);

      // Fetch latest NAV for each fund
      const schemeCodes = activeFunds.map(f => f.scheme_code);
      await this.batchFetchNavs(schemeCodes, stats);

      console.log(`[MFAPI Ingestion] NAV records updated: ${stats.navInserted}`);

      // Complete sync
      await fundSyncLogModel.completeSyncSuccess(syncId, stats);

      const summary = {
        success: true,
        syncId,
        ...stats,
        errorSummary: stats.errorDetails.slice(0, 10)
      };

      console.log('[MFAPI Ingestion] Incremental sync completed');
      console.log('[MFAPI Ingestion] Summary:', JSON.stringify(summary, null, 2));

      return summary;
    } catch (error) {
      console.error('[MFAPI Ingestion] Incremental sync failed:', error);

      if (syncId) {
        await fundSyncLogModel.completeSyncFailure(syncId, error);
      }

      return {
        success: false,
        error: error.message,
        stack: error.stack,
        ...stats
      };
    }
  },

  /**
   * Fetch all funds from MFAPI
   * @returns {Promise<Array>} Array of fund objects
   */
  async fetchAllFunds() {
    try {
      // MFAPI endpoint: GET https://api.mfapi.in/mf
      const response = await mfApiService.getAllFunds();
      return response || [];
    } catch (error) {
      console.error('[MFAPI Ingestion] Failed to fetch all funds:', error);
      throw new Error(`MFAPI fetch failed: ${error.message}`);
    }
  },

  /**
   * Filter funds by AMC whitelist
   * @param {Array} funds - All funds from MFAPI
   * @returns {Array} Filtered funds
   */
  filterByWhitelist(funds) {
    return funds.filter(fund => {
      const fundName = (fund.schemeName || '').toLowerCase();
      return AMC_WHITELIST.some(amc => fundName.includes(amc.toLowerCase()));
    });
  },

  /**
   * Batch fetch NAV for multiple funds with rate limiting
   * @param {Array} schemeCodes - Array of scheme codes
   * @param {Object} stats - Statistics object to update
   * @param {number} batchSize - Funds per batch
   */
  async batchFetchNavs(schemeCodes, stats, batchSize = BATCH_SIZE) {
    const totalBatches = Math.ceil(schemeCodes.length / batchSize);
    console.log(`[MFAPI Ingestion] Processing ${schemeCodes.length} funds in ${totalBatches} batches...`);

    for (let i = 0; i < schemeCodes.length; i += batchSize) {
      const batch = schemeCodes.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;

      console.log(`[MFAPI Ingestion] Batch ${batchNumber}/${totalBatches}: Processing ${batch.length} funds...`);

      // Process batch with concurrency limit
      const promises = batch.map(async (schemeCode) => {
        try {
          // Fetch latest NAV from MFAPI
          const navData = await mfApiService.getLatestNAV(schemeCode);

          if (navData && navData.data && navData.data.length > 0) {
            const latestNav = navData.data[0];

            // Upsert NAV record
            await fundNavHistoryModel.upsertNavRecord(
              schemeCode,
              latestNav.date,
              parseFloat(latestNav.nav)
            );

            // Update Fund Metadata (Category, ISIN) from Meta
            if (navData.meta) {
              await fundModel.updateMeta(schemeCode, {
                scheme_category: navData.meta.scheme_category,
                fund_house: navData.meta.fund_house, // Ensure fund house is accurate from source
                isin: navData.meta.isin_growth || navData.meta.isin_div_reinvestment
              });
            }

            // Auto-cleanup: Keep only latest 30 records
            await fundNavHistoryModel.deleteOldRecords(schemeCode, NAV_RETENTION_COUNT);

            stats.navInserted++;

            // Log every 100 NAV inserts
            if (stats.navInserted % 100 === 0) {
              console.log(`[MFAPI Ingestion] NAV progress: ${stats.navInserted}/${schemeCodes.length} records inserted`);
            }
          } else {
            stats.errors++;
            stats.errorDetails.push({
              schemeCode,
              error: 'No NAV data returned',
              step: 'nav_fetch'
            });
          }
        } catch (error) {
          stats.errors++;
          stats.errorDetails.push({
            schemeCode,
            error: error.message,
            step: 'nav_fetch'
          });
          console.error(`[MFAPI Ingestion] NAV fetch failed for ${schemeCode}:`, error.message);
        }
      });

      // Wait for all promises in batch to complete
      await Promise.all(promises);

      // Rate limiting: Wait between batches
      if (i + batchSize < schemeCodes.length) {
        console.log(`[MFAPI Ingestion] Rate limit delay: ${RATE_LIMIT_DELAY}ms`);
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
    }

    console.log(`[MFAPI Ingestion] NAV fetch completed. Success: ${stats.navInserted}, Errors: ${stats.errors}`);
  },

  /**
   * Transform MFAPI data to database schema
   * @param {Object} mfapiData - Raw fund data from MFAPI
   * @returns {Object} Transformed fund data for database
   */
  transformFundData(mfapiData) {
    return {
      scheme_code: mfapiData.schemeCode,
      scheme_name: mfapiData.schemeName,
      scheme_category: null, // Will be fetched separately if needed
      scheme_type: this.extractSchemeType(mfapiData.schemeName),
      fund_house: this.extractFundHouse(mfapiData.schemeName),
      amc_code: null,
      launch_date: null,
      isin: null,
      is_active: true
    };
  },

  /**
   * Extract fund house name from scheme name
   * @param {string} schemeName - Full scheme name
   * @returns {string} Fund house name
   */
  extractFundHouse(schemeName) {
    if (!schemeName) return 'Unknown';

    for (const amc of AMC_WHITELIST) {
      if (schemeName.includes(amc)) {
        return amc;
      }
    }
    return 'Unknown';
  },

  /**
   * Extract scheme type from scheme name
   * @param {string} schemeName - Full scheme name
   * @returns {string|null} Scheme type
   */
  extractSchemeType(schemeName) {
    if (!schemeName) return null;

    const nameLower = schemeName.toLowerCase();

    if (nameLower.includes('direct')) return 'DIRECT';
    if (nameLower.includes('regular')) return 'REGULAR';

    return null;
  },

  /**
   * Get ingestion statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    const [
      syncStats,
      totalFunds,
      totalNavRecords,
      lastSync
    ] = await Promise.all([
      fundSyncLogModel.getSyncStatistics(30),
      fundModel.getTotalCount(),
      fundNavHistoryModel.getTotalRecordCount(),
      fundSyncLogModel.getLastSuccessfulSync()
    ]);

    return {
      database: {
        totalFunds,
        totalNavRecords,
        averageNavRecordsPerFund: totalFunds > 0 ? (totalNavRecords / totalFunds).toFixed(2) : 0
      },
      sync: {
        ...syncStats,
        lastSuccessfulSync: lastSync ? {
          syncId: lastSync.id,
          syncType: lastSync.sync_type,
          completedAt: new Date(lastSync.end_time).toISOString(),
          duration: `${(lastSync.execution_duration_ms / 1000).toFixed(2)}s`,
          fundsProcessed: lastSync.total_funds_fetched,
          navRecordsAdded: lastSync.nav_records_inserted
        } : null
      },
      whitelistedAMCs: AMC_WHITELIST
    };
  }
};
