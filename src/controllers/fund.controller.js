import mfApiService from '../services/mfapi.service.js';

/**
 * Fund Controller - handles fund-related HTTP requests
 */
export const fundController = {
  /**
   * GET /api/funds/:schemeCode
   * Get detailed information for a specific fund
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

      // Fetch scheme details with performance metrics
      const details = await mfApiService.getSchemeDetails(code);

      if (!details || details.status === 'ERROR') {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }

      res.json({
        success: true,
        data: {
          meta: {
            scheme_code: details.meta?.scheme_code,
            scheme_name: details.meta?.scheme_name,
            fund_house: details.meta?.fund_house,
            scheme_type: details.meta?.scheme_type,
            scheme_category: details.meta?.scheme_category,
            isin_growth: details.meta?.isin_growth,
            isin_div_reinvestment: details.meta?.isin_div_reinvestment
          },
          latestNav: details.latestNAV ? {
            nav: details.latestNAV.nav,
            date: details.latestNAV.date
          } : null,
          navHistory: details.history.map(h => ({
            date: h.date,
            nav: h.nav
          })),
          performance: details.performance
        }
      });
    } catch (error) {
      // Handle 404 from MFapi
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }
      next(error);
    }
  },

  /**
   * GET /api/funds/:schemeCode/nav
   * Get latest NAV for a fund
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

      const data = await mfApiService.getLatestNAV(code);

      if (!data || data.status === 'ERROR') {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }

      res.json({
        success: true,
        data: {
          schemeCode: data.meta?.scheme_code,
          schemeName: data.meta?.scheme_name,
          nav: data.data?.[0]?.nav,
          date: data.data?.[0]?.date
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }
      next(error);
    }
  },

  /**
   * GET /api/funds/:schemeCode/history
   * Get NAV history for a fund
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

      const data = await mfApiService.getNAVHistory(code, startDate, endDate);

      if (!data || data.status === 'ERROR') {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }

      // Apply limit if specified
      let history = data.data || [];
      if (limit) {
        const limitNum = parseInt(limit, 10);
        if (!isNaN(limitNum) && limitNum > 0) {
          history = history.slice(0, limitNum);
        }
      }

      res.json({
        success: true,
        data: {
          meta: {
            schemeCode: data.meta?.scheme_code,
            schemeName: data.meta?.scheme_name,
            fundHouse: data.meta?.fund_house
          },
          totalRecords: data.data?.length || 0,
          returnedRecords: history.length,
          history: history.map(h => ({
            date: h.date,
            nav: h.nav
          }))
        }
      });
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(404).json({
          success: false,
          error: 'Fund not found'
        });
      }
      next(error);
    }
  },

  /**
   * GET /api/funds/search
   * Search funds by name
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

      const results = await mfApiService.searchSchemes(q.trim());

      res.json({
        success: true,
        data: {
          query: q.trim(),
          count: results.length,
          results: results.map(r => ({
            schemeCode: r.schemeCode,
            schemeName: r.schemeName
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default fundController;
