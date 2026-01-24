import { localFundService } from '../services/localFund.service.js';
import { fundModel } from '../models/fund.model.js';

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
      const details = await localFundService.getSchemeDetails(code);

      if (!details) {
        return res.status(404).json({
          success: false,
          error: 'Fund not found in local database. Please ensure the fund sync has been run.'
        });
      }

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
      const fund = await fundModel.getBySchemeCode(code);

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
      const fund = await fundModel.getBySchemeCode(code);

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
