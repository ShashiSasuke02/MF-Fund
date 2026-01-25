import amcModel from '../models/amc.model.js';
import { localFundService } from '../services/localFund.service.js';

/**
 * AMC Controller - handles AMC-related HTTP requests
 * 
 * LOCAL-FIRST ARCHITECTURE: All fund data is served from local database.
 * MFAPI is ONLY accessed by sync jobs (mfapiIngestion.service.js).
 */
export const amcController = {
  /**
   * GET /api/amcs
   * Get all AMCs with optional scheme counts (from local DB)
   */
  async getAll(req, res, next) {
    try {
      const amcs = await amcModel.getAll();

      // Enrich with scheme counts from LOCAL DATABASE
      const enriched = await Promise.all(
        amcs.map(async (amc) => {
          try {
            const schemes = await localFundService.getSchemesByFundHouse(amc.fund_house);
            return {
              fundHouse: amc.fund_house,
              displayName: amc.display_name,
              displayOrder: amc.display_order,
              logoUrl: amc.logo_url,
              schemeCount: schemes.length,
              dataSource: 'LOCAL_DB'
            };
          } catch (e) {
            // If query fails, return without scheme count
            return {
              fundHouse: amc.fund_house,
              displayName: amc.display_name,
              displayOrder: amc.display_order,
              logoUrl: amc.logo_url,
              schemeCount: null,
              dataSource: 'LOCAL_DB'
            };
          }
        })
      );

      res.json({
        success: true,
        data: enriched,
        dataSource: 'LOCAL_DB'
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/amcs/:fundHouse
   * Get single AMC details (from local DB)
   */
  async getOne(req, res, next) {
    try {
      const { fundHouse } = req.params;
      const amc = await amcModel.getByFundHouse(fundHouse);

      if (!amc) {
        return res.status(404).json({
          success: false,
          error: 'AMC not found'
        });
      }

      // Get scheme count from LOCAL DATABASE
      let schemeCount = null;
      try {
        const schemes = await localFundService.getSchemesByFundHouse(fundHouse);
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
          schemeCount,
          dataSource: 'LOCAL_DB'
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/amcs/:fundHouse/funds
   * Get all funds for a specific AMC (from local DB)
   */
  async getFunds(req, res, next) {
    try {
      const { fundHouse } = req.params;
      const { search, category, sort } = req.query;

      // Verify AMC exists
      if (!await amcModel.exists(fundHouse)) {
        return res.status(404).json({
          success: false,
          error: 'AMC not found'
        });
      }

      // Fetch schemes from LOCAL DATABASE
      const allSchemes = await localFundService.getSchemesByFundHouse(fundHouse);

      // Extract unique categories from FULL list (before filtering)
      // This ensures the dropdown options don't disappear when a category is selected
      const categories = [...new Set(
        allSchemes
          .map(s => s.schemeCategory)
          .filter(Boolean)
      )].sort();

      let schemes = [...allSchemes];

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

      res.json({
        success: true,
        data: {
          fundHouse,
          totalCount: schemes.length,
          categories, // Returns FULL list of categories
          schemes: schemes.map(s => ({
            schemeCode: s.schemeCode,
            schemeName: s.schemeName,
            schemeType: s.schemeType,
            schemeCategory: s.schemeCategory,
            nav: s.nav,
            date: s.date
          })),
          dataSource: 'LOCAL_DB'
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default amcController;
