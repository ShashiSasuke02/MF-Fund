import amcModel from '../models/amc.model.js';
import mfApiService from '../services/mfapi.service.js';

/**
 * AMC Controller - handles AMC-related HTTP requests
 */
export const amcController = {
  /**
   * GET /api/amcs
   * Get all AMCs with optional scheme counts
   */
  async getAll(req, res, next) {
    try {
      const amcs = amcModel.getAll();
      
      // Optionally enrich with scheme counts from cached data
      const enriched = await Promise.all(
        amcs.map(async (amc) => {
          try {
            const schemes = await mfApiService.getSchemesByFundHouse(amc.fund_house);
            return {
              fundHouse: amc.fund_house,
              displayName: amc.display_name,
              displayOrder: amc.display_order,
              logoUrl: amc.logo_url,
              schemeCount: schemes.length
            };
          } catch (e) {
            // If API fails, return without scheme count
            return {
              fundHouse: amc.fund_house,
              displayName: amc.display_name,
              displayOrder: amc.display_order,
              logoUrl: amc.logo_url,
              schemeCount: null
            };
          }
        })
      );

      res.json({
        success: true,
        data: enriched
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/amcs/:fundHouse
   * Get single AMC details
   */
  async getOne(req, res, next) {
    try {
      const { fundHouse } = req.params;
      const amc = amcModel.getByFundHouse(fundHouse);

      if (!amc) {
        return res.status(404).json({
          success: false,
          error: 'AMC not found'
        });
      }

      // Get scheme count
      let schemeCount = null;
      try {
        const schemes = await mfApiService.getSchemesByFundHouse(fundHouse);
        schemeCount = schemes.length;
      } catch (e) {
        console.error('[AMC Controller] Failed to get scheme count:', e.message);
      }

      res.json({
        success: true,
        data: {
          fundHouse: amc.fund_house,
          displayName: amc.display_name,
          displayOrder: amc.display_order,
          logoUrl: amc.logo_url,
          schemeCount
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/amcs/:fundHouse/funds
   * Get all funds for a specific AMC
   */
  async getFunds(req, res, next) {
    try {
      const { fundHouse } = req.params;
      const { search, category, sort } = req.query;

      // Verify AMC exists
      if (!amcModel.exists(fundHouse)) {
        return res.status(404).json({
          success: false,
          error: 'AMC not found'
        });
      }

      // Fetch schemes from MFapi
      let schemes = await mfApiService.getSchemesByFundHouse(fundHouse);

      // Apply search filter
      if (search) {
        const searchLower = search.toLowerCase();
        schemes = schemes.filter(s => 
          s.schemeName?.toLowerCase().includes(searchLower)
        );
      }

      // Apply category filter
      if (category) {
        const categoryLower = category.toLowerCase();
        schemes = schemes.filter(s => 
          s.schemeCategory?.toLowerCase().includes(categoryLower)
        );
      }

      // Apply sorting
      if (sort) {
        switch (sort) {
          case 'name_asc':
            schemes.sort((a, b) => (a.schemeName || '').localeCompare(b.schemeName || ''));
            break;
          case 'name_desc':
            schemes.sort((a, b) => (b.schemeName || '').localeCompare(a.schemeName || ''));
            break;
          case 'nav_asc':
            schemes.sort((a, b) => parseFloat(a.nav || 0) - parseFloat(b.nav || 0));
            break;
          case 'nav_desc':
            schemes.sort((a, b) => parseFloat(b.nav || 0) - parseFloat(a.nav || 0));
            break;
          default:
            // Default: sort by scheme name
            schemes.sort((a, b) => (a.schemeName || '').localeCompare(b.schemeName || ''));
        }
      }

      // Get unique categories for filter options
      const categories = [...new Set(
        schemes
          .map(s => s.schemeCategory)
          .filter(Boolean)
      )].sort();

      res.json({
        success: true,
        data: {
          fundHouse,
          totalCount: schemes.length,
          categories,
          schemes: schemes.map(s => ({
            schemeCode: s.schemeCode,
            schemeName: s.schemeName,
            schemeType: s.schemeType,
            schemeCategory: s.schemeCategory,
            nav: s.nav,
            date: s.date,
            isinGrowth: s.isinGrowth,
            isinDivReinvestment: s.isinDivReinvestment
          }))
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default amcController;
