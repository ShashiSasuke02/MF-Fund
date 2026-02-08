import { localFundService } from '../services/localFund.service.js';
import { fundModel } from '../models/fund.model.js';
import fundEnrichmentService from '../services/fundEnrichment.service.js';
import logger from '../services/logger.service.js';

/**
 * Fund Controller - handles fund-related HTTP requests
 * 
 * LOCAL-FIRST ARCHITECTURE: All fund data is served from local database.
 * MFAPI is ONLY accessed by sync jobs (mfapiIngestion.service.js).
 */
export const fundController = {
  /**
   * GET /api/funds/:schemeCode
   * Get detailed information for a specific fund (from local DB)
   */
  async getDetails(req, res, next) {
    try {
      const { schemeCode } = req.params;

      // Validate schemeCode is numeric
      const code = parseInt(schemeCode, 10);
      if (isNaN(code)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid scheme code. Must be a number.'
        });
      }

      // Fetch scheme details from LOCAL DATABASE
      let details = await localFundService.getSchemeDetails(code);

      if (!details) {
        return res.status(404).json({
          success: false,
          error: 'Fund not found in local database. Please ensure the fund sync has been run.'
        });
      }

      // --- Enrichment Logic (Captain Nemo Integration) ---
      // Check if we need to fetch external data (missing or stale > 7 days)
      const isStale = !details.meta.detail_info_synced_at ||
        (Date.now() - details.meta.detail_info_synced_at > 7 * 24 * 60 * 60 * 1000);

      const hasISIN = !!details.meta.isin_growth;

      if (isStale && hasISIN) {
        try {
          // Fetch from Enrichment Service
          const enrichedData = await fundEnrichmentService.fetchFundDetails(details.meta.isin_growth, req.requestId);

          if (enrichedData) {
            // Persist to DB
            await localFundService.updateEnrichmentData(code, enrichedData);

            // Merge into current response to avoid a re-fetch
            details.meta = { ...details.meta, ...enrichedData };

            logger.info(`Served enriched data for ${code}`, { requestId: req.requestId });
          }
        } catch (err) {
          // Failure should not block the main response
        }
      }

      // --- Fallback Strategy: Peer Lookup ---
      // If essential data (AUM) is still missing after enrichment attempt,
      // try to borrow metadata from a "Peer Fund" (specifically "Direct Plan - Growth")
      if (!details.meta.aum) {
        try {
          // Extract Base Name: "ICICI Prudential Bharat Consumption Fund - Growth Option" -> "ICICI Prudential Bharat Consumption Fund"
          // Strict logic: Take everything before the FIRST " - "
          const baseName = details.meta.scheme_name.split(' - ')[0].trim();

          if (baseName && baseName.length > 5) { // Avoid very short/ambiguous names
            // Find a peer that matches the Base Name EXACTLY
            const peerFund = await fundModel.findPeerFundWithData(baseName, code);

            if (peerFund) {
              logger.info(`Using peer fund data via Exact Match fallback`, {
                targetScheme: code,
                targetName: details.meta.scheme_name,
                matchName: baseName,
                requestId: req.requestId
              });

              // Merge shared metadata fields if they are missing in current fund
              details.meta.aum = details.meta.aum || peerFund.aum;
              details.meta.fund_manager = details.meta.fund_manager || peerFund.fund_manager;
              details.meta.investment_objective = details.meta.investment_objective || peerFund.investment_objective;
              details.meta.fund_start_date = details.meta.fund_start_date || peerFund.fund_start_date;
              details.meta.risk_level = details.meta.risk_level || peerFund.risk_level;
              details.meta.expense_ratio = details.meta.expense_ratio || peerFund.expense_ratio;

              // Mark source as peer for visibility (optional, currently not displayed in UI)
              details.meta.data_source_type = 'PEER_FALLBACK';
            } else {
              logger.debug(`No suitable Direct Plan peer found for fallback`, {
                baseName,
                schemeCode: code
              });
            }
          }
        } catch (fallbackErr) {
          logger.warn(`Peer fallback failed for ${code}`, { error: fallbackErr.message });
        }
      }
      // Wait, I am writing the logic now.

      res.json({
        success: true,
        data: {
          meta: details.meta,
          latestNav: details.latestNav,
          navHistory: details.navHistory,
          dataSource: details.dataSource
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/funds/:schemeCode/nav
   * Get latest NAV for a fund (from local DB)
   */
  async getLatestNAV(req, res, next) {
    try {
      const { schemeCode } = req.params;

      const code = parseInt(schemeCode, 10);
      if (isNaN(code)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid scheme code. Must be a number.'
        });
      }

      // Get fund info from local DB
      const fund = await fundModel.findBySchemeCode(code);

      // Get latest NAV from LOCAL DATABASE
      const navData = await localFundService.getLatestNAV(code);

      if (!navData) {
        return res.status(404).json({
          success: false,
          error: 'NAV not found in local database. Please ensure the fund sync has been run.'
        });
      }

      res.json({
        success: true,
        data: {
          schemeCode: code,
          schemeName: fund?.scheme_name || 'Unknown',
          nav: navData.nav,
          date: navData.date,
          dataSource: navData.dataSource
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/funds/:schemeCode/history
   * Get NAV history for a fund (from local DB)
   */
  async getHistory(req, res, next) {
    try {
      const { schemeCode } = req.params;
      const { startDate, endDate, limit } = req.query;

      const code = parseInt(schemeCode, 10);
      if (isNaN(code)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid scheme code. Must be a number.'
        });
      }

      // Validate date formats if provided (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (startDate && !dateRegex.test(startDate)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid startDate format. Use YYYY-MM-DD.'
        });
      }
      if (endDate && !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid endDate format. Use YYYY-MM-DD.'
        });
      }

      // Get fund info
      const fund = await fundModel.findBySchemeCode(code);

      // Get NAV history from LOCAL DATABASE
      const limitNum = limit ? parseInt(limit, 10) : 30;
      const data = await localFundService.getNAVHistory(code, startDate, endDate, limitNum);

      res.json({
        success: true,
        data: {
          meta: {
            schemeCode: code,
            schemeName: fund?.scheme_name || 'Unknown',
            fundHouse: fund?.fund_house || 'Unknown'
          },
          totalRecords: data.data?.length || 0,
          returnedRecords: data.data?.length || 0,
          history: data.data,
          dataSource: data.dataSource
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/funds/search
   * Search funds by name (from local DB)
   */
  async search(req, res, next) {
    try {
      const { q } = req.query;

      if (!q || q.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Search query (q) is required'
        });
      }

      // Search from LOCAL DATABASE
      const results = await localFundService.searchSchemes(q.trim());

      res.json({
        success: true,
        data: {
          query: q.trim(),
          count: results.length,
          results: results,
          dataSource: 'LOCAL_DB'
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default fundController;
