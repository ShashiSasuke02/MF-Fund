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
  'Mirae Asset',
  'DSP',
  'Bandhan'
];

// Constants for Filtering
const EXCLUDED_KEYWORDS = ['( IDCW )', '(IDCW)', 'DIVIDEND'];
const EXCLUDED_CATEGORIES = ['Equity Scheme - Dividend Yield Fund'];

const NAV_RETENTION_COUNT = 30; // Keep latest 30 NAV records per fund
const BATCH_SIZE = parseInt(process.env.MFAPI_BATCH_SIZE) || 10; // Reduced to prevent DB connection pool exhaustion
const RATE_LIMIT_DELAY = 1000; // 1s delay between batches for connection cleanup

export const mfapiIngestionService = {
  /**
   * Full sync: Fetch all funds from 10 AMCs + latest NAV
   * OPTIMIZED: Uses /mf/latest endpoint to get funds with NAV in one call
   * Filters to only include funds with NAV updated in current month
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
      skippedInactive: 0,
      errorDetails: []
    };

    try {
      console.log('[MFAPI Ingestion] Starting OPTIMIZED full sync for 10 AMCs...');
      syncId = await fundSyncLogModel.startSync('FULL');

      // Step 1: Fetch all funds with NAV data from /mf/latest (single API call)
      console.log('[MFAPI Ingestion] Fetching all funds with NAV from /mf/latest...');
      const allFundsWithNav = await this.fetchAllFundsWithNav();
      console.log(`[MFAPI Ingestion] Total funds fetched from MFAPI: ${allFundsWithNav.length}`);

      // Step 2: Filter by current month NAV update (active funds only)
      const currentMonthFunds = this.filterByCurrentMonth(allFundsWithNav);
      console.log(`[MFAPI Ingestion] Funds with NAV updated this month: ${currentMonthFunds.length}`);
      stats.skippedInactive = allFundsWithNav.length - currentMonthFunds.length;

      // Step 3: Filter by AMC whitelist
      const whitelistedFunds = this.filterByWhitelistWithNav(currentMonthFunds);
      console.log(`[MFAPI Ingestion] Whitelisted funds (10 AMCs, current month): ${whitelistedFunds.length}`);
      stats.totalFetched = whitelistedFunds.length;

      // Step 4: Apply Exclusion Filters (IDCW, Dividend Yield)
      const finalFunds = this.filterByExclusions(whitelistedFunds);
      console.log(`[MFAPI Ingestion] Funds after exclusions: ${finalFunds.length} (Removed: ${whitelistedFunds.length - finalFunds.length})`);

      // Step 5: Upsert funds to database (BATCH PROCESSING)
      console.log('[MFAPI Ingestion] Upserting funds to database...');
      const upsertStartTime = Date.now();

      const FUND_UPSERT_BATCH_SIZE = 100;
      const totalBatches = Math.ceil(finalFunds.length / FUND_UPSERT_BATCH_SIZE);

      for (let i = 0; i < finalFunds.length; i += FUND_UPSERT_BATCH_SIZE) {
        const batch = finalFunds.slice(i, i + FUND_UPSERT_BATCH_SIZE);
        const batchNum = Math.floor(i / FUND_UPSERT_BATCH_SIZE) + 1;

        try {
          // Transform batch with enriched data from /mf/latest
          const transformedBatch = batch.map(fund => this.transformFullFundData(fund));

          // Bulk Upsert Funds
          await fundModel.bulkUpsertFunds(transformedBatch);
          stats.inserted += batch.length;

          // Upsert NAV records (already have NAV data from /mf/latest!)
          for (const fund of batch) {
            if (fund.nav && fund.date) {
              try {
                await fundNavHistoryModel.upsertNavRecord(
                  fund.schemeCode,
                  fund.date,
                  parseFloat(fund.nav)
                );
                stats.navInserted++;
              } catch (navError) {
                stats.errors++;
                stats.errorDetails.push({ schemeCode: fund.schemeCode, error: navError.message, step: 'nav_upsert' });
              }
            }
          }

          console.log(`[MFAPI Ingestion] Batch ${batchNum}/${totalBatches}: ${stats.inserted}/${finalFunds.length} funds, ${stats.navInserted} NAVs`);
        } catch (error) {
          console.error(`[MFAPI Ingestion] Batch ${batchNum} failed:`, error.message);
          console.log(`[MFAPI Ingestion] Falling back to sequential upsert for batch ${batchNum}...`);

          for (const fund of batch) {
            try {
              await fundModel.upsertFund(this.transformFullFundData(fund));
              stats.inserted++;

              if (fund.nav && fund.date) {
                await fundNavHistoryModel.upsertNavRecord(fund.schemeCode, fund.date, parseFloat(fund.nav));
                stats.navInserted++;
              }
            } catch (innerErr) {
              stats.errors++;
              stats.errorDetails.push({ schemeCode: fund.schemeCode, error: innerErr.message });
            }
          }
          console.log(`[MFAPI Ingestion] Batch ${batchNum} sequential fallback complete`);
        }
      }

      const upsertDuration = ((Date.now() - upsertStartTime) / 1000).toFixed(2);
      console.log(`[MFAPI Ingestion] Fund + NAV upsert complete in ${upsertDuration}s`);
      console.log(`[MFAPI Ingestion] Funds: ${stats.inserted}, NAVs: ${stats.navInserted}, Errors: ${stats.errors}`);
      console.log(`[MFAPI Ingestion] Skipped inactive (old NAV): ${stats.skippedInactive}`);

      // Step 5: Mark inactive funds (funds with no NAV for 7+ days)
      console.log('[MFAPI Ingestion] Checking for inactive funds...');
      const inactiveResult = await this.markInactiveFunds();
      stats.markedInactive = inactiveResult.count || 0;
      console.log(`[MFAPI Ingestion] Marked ${stats.markedInactive} funds as inactive`);

      // Step 6: Complete sync
      await fundSyncLogModel.completeSyncSuccess(syncId, stats);

      const summary = {
        success: true,
        syncId,
        ...stats,
        optimization: 'Used /mf/latest endpoint - no individual NAV API calls needed!',
        errorSummary: stats.errorDetails.slice(0, 10)
      };

      console.log('[MFAPI Ingestion] Full sync completed successfully');
      console.log('[MFAPI Ingestion] Summary:', JSON.stringify(summary, null, 2));

      return summary;
    } catch (error) {
      console.error('[MFAPI Ingestion] Full sync failed:', error.message);

      // Secondary check to ensure we don't crash if DB connection is lost
      if (syncId) {
        try {
          await fundSyncLogModel.completeSyncFailure(syncId, error);
        } catch (dbError) {
          console.error('[MFAPI Ingestion] Critical: Failed to log sync failure to database:', dbError.message);
        }
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
      console.error('[MFAPI Ingestion] Incremental sync failed:', error.message);

      if (syncId) {
        try {
          await fundSyncLogModel.completeSyncFailure(syncId, error);
        } catch (dbError) {
          console.error('[MFAPI Ingestion] Critical: Failed to log incremental sync failure to database:', dbError.message);
        }
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
   * OPTIMIZED: Fetch all funds WITH NAV data from /mf/latest
   * Single API call returns funds with their latest NAV and date
   * @returns {Promise<Array>} Array of fund objects with NAV data
   */
  async fetchAllFundsWithNav() {
    try {
      // MFAPI endpoint: GET https://api.mfapi.in/mf/latest
      const response = await mfApiService.getLatestNAVAll();
      return response || [];
    } catch (error) {
      console.error('[MFAPI Ingestion] Failed to fetch all funds with NAV:', error);
      throw new Error(`MFAPI /mf/latest fetch failed: ${error.message}`);
    }
  },

  /**
   * Filter funds to only include those with NAV updated in current month
   * This effectively filters out inactive/closed funds
   * @param {Array} funds - All funds with NAV data
   * @returns {Array} Funds with recent NAV updates
   */
  filterByCurrentMonth(funds) {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-indexed

    return funds.filter(fund => {
      if (!fund.date) return false;

      // Parse date format: DD-MM-YYYY
      const parts = fund.date.split('-');
      if (parts.length !== 3) return false;

      const navYear = parseInt(parts[2], 10);
      const navMonth = parseInt(parts[1], 10);

      // Include if NAV is from current month or this year (within last 30 days logic)
      return navYear === currentYear && navMonth === currentMonth;
    });
  },

  /**
   * Filter funds based on exclusion criteria (IDCW, Dividend Yield)
   * @param {Array} funds - List of funds
   * @returns {Array} Filtered list
   */
  filterByExclusions(funds) {
    return funds.filter(fund => {
      const name = (fund.schemeName || '').toUpperCase();
      const category = (fund.schemeCategory || '').trim();

      // Check Name Exclusions (IDCW, DIVIDEND)
      if (EXCLUDED_KEYWORDS.some(keyword => name.includes(keyword))) {
        return false; // Exclude
      }

      // Check Category Exclusions
      if (EXCLUDED_CATEGORIES.includes(category)) {
        return false; // Exclude
      }

      return true; // Keep
    });
  },

  /**
   * Filter funds by AMC whitelist (for /mf/latest data structure)
   * @param {Array} funds - All funds from /mf/latest
   * @returns {Array} Filtered funds
   */
  filterByWhitelistWithNav(funds) {
    return funds.filter(fund => {
      // /mf/latest has fundHouse field directly
      const fundHouse = (fund.fundHouse || '').toLowerCase();
      const schemeName = (fund.schemeName || '').toLowerCase();

      return AMC_WHITELIST.some(amc => {
        const amcLower = amc.toLowerCase();
        return fundHouse.includes(amcLower) || schemeName.includes(amcLower);
      });
    });
  },

  /**
   * Transform full fund data from /mf/latest to database schema
   * This has more complete data than the basic /mf endpoint
   * @param {Object} mfapiData - Raw fund data from /mf/latest
   * @returns {Object} Transformed fund data for database
   */
  transformFullFundData(mfapiData) {
    return {
      scheme_code: mfapiData.schemeCode,
      scheme_name: mfapiData.schemeName,
      scheme_category: mfapiData.schemeCategory || null,
      scheme_type: mfapiData.schemeType || this.extractSchemeType(mfapiData.schemeName),
      fund_house: mfapiData.fundHouse || this.extractFundHouse(mfapiData.schemeName),
      amc_code: null,
      launch_date: null,
      isin: mfapiData.isinGrowth || mfapiData.isinDivReinvestment || null,
      is_active: true
    };
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
            // No NAV data returned - mark fund for potential inactivation
            stats.errors++;
            stats.errorDetails.push({
              schemeCode,
              error: 'No NAV data returned - fund may be inactive/closed',
              step: 'nav_fetch'
            });

            // Track for inactive marking (accumulated errors)
            if (!stats.noNavFunds) stats.noNavFunds = [];
            stats.noNavFunds.push(schemeCode);
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
  },

  /**
   * Mark funds as inactive if they haven't received NAV updates
   * This helps skip stale/closed funds on future syncs
   * @param {number} daysWithoutNav - Days without NAV update to consider inactive (default 7)
   * @returns {Object} Result with count of funds marked inactive
   */
  async markInactiveFunds(daysWithoutNav = 7) {
    try {
      // Find funds without recent NAV
      const staleFunds = await fundModel.findFundsWithoutRecentNav(daysWithoutNav);

      if (staleFunds.length === 0) {
        console.log('[MFAPI Ingestion] No inactive funds found');
        return { count: 0, funds: [] };
      }

      console.log(`[MFAPI Ingestion] Found ${staleFunds.length} funds without NAV in ${daysWithoutNav} days`);

      // Get scheme codes to mark inactive
      const schemeCodes = staleFunds.map(f => f.scheme_code);

      // Mark them as inactive
      await fundModel.markInactive(schemeCodes);

      console.log(`[MFAPI Ingestion] Marked ${schemeCodes.length} funds as inactive:`);
      staleFunds.forEach(f => {
        console.log(`  - ${f.scheme_code}: ${f.scheme_name} (Last NAV: ${f.last_nav_date || 'Never'})`);
      });

      return {
        count: schemeCodes.length,
        funds: staleFunds.map(f => ({
          schemeCode: f.scheme_code,
          schemeName: f.scheme_name,
          fundHouse: f.fund_house,
          lastNavDate: f.last_nav_date
        }))
      };
    } catch (error) {
      console.error('[MFAPI Ingestion] Failed to mark inactive funds:', error.message);
      return { count: 0, error: error.message };
    }
  }
};
