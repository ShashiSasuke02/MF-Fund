import { fundModel } from '../models/fund.model.js';
import { fundNavHistoryModel } from '../models/fundNavHistory.model.js';
import { query } from '../db/database.js';
import logger from './logger.service.js';

/**
 * Local Fund Service
 * Provides fund data from local database (Local-First architecture)
 * 
 * IMPORTANT: This service should be used by all application modules.
 * MFAPI should ONLY be accessed by sync jobs (mfapiIngestion.service.js).
 */
export const localFundService = {
    /**
     * Get scheme details from local database
     * @param {string|number} schemeCode - Scheme code
     * @returns {object|null} Scheme details with latest NAV
     */
    async getSchemeDetails(schemeCode) {
        try {
            // Get fund from local DB
            const fund = await fundModel.findBySchemeCode(schemeCode);

            if (!fund) {
                return null;
            }

            // Get latest NAV from history
            const latestNav = await fundNavHistoryModel.getLatestNav(schemeCode);

            // Get NAV history (last 30 records)
            const navHistory = await fundNavHistoryModel.getNavHistory(schemeCode, 30);

            return {
                meta: {
                    fund_house: fund.fund_house,
                    scheme_type: fund.scheme_type,
                    scheme_category: fund.scheme_category,
                    scheme_code: fund.scheme_code,
                    scheme_name: fund.scheme_name,
                    isin_growth: fund.isin || null,
                    isin_div_reinvestment: null,

                    // Enrichment Fields
                    aum: fund.aum,
                    expense_ratio: fund.expense_ratio,
                    risk_level: fund.risk_level,
                    returns_1y: fund.returns_1y,
                    returns_3y: fund.returns_3y,
                    returns_5y: fund.returns_5y,
                    min_lumpsum: fund.min_lumpsum,
                    min_sip: fund.min_sip,
                    fund_manager: fund.fund_manager,
                    investment_objective: fund.investment_objective,
                    fund_start_date: fund.fund_start_date,
                    detail_info_synced_at: fund.detail_info_synced_at
                },
                latestNav: latestNav ? {
                    nav: latestNav.nav_value,
                    date: latestNav.nav_date
                } : null,
                navHistory: navHistory.map(n => ({
                    date: n.nav_date,
                    nav: n.nav.toString()
                })),
                dataSource: 'LOCAL_DB'
            };
        } catch (error) {
            logger.error(`[LocalFundService] getSchemeDetails failed for ${schemeCode}: ${error.message}`);
            throw error;
        }
    },

    /**
     * Update enrichment details for a fund
     * @param {number} schemeCode 
     * @param {Object} data 
     */
    async updateEnrichmentData(schemeCode, data) {
        return fundModel.updateEnrichmentData(schemeCode, data);
    },

    /**
     * Get latest NAV from local database
     * @param {string|number} schemeCode - Scheme code
     * @returns {object|null} Latest NAV data
     */
    async getLatestNAV(schemeCode) {
        try {
            const navRecord = await fundNavHistoryModel.getLatestNav(schemeCode);

            if (!navRecord) {
                logger.warn(`[LocalFundService] No NAV found for scheme ${schemeCode}`);
                return null;
            }

            return {
                nav: parseFloat(navRecord.nav_value),
                date: navRecord.nav_date,
                dataSource: 'LOCAL_DB'
            };
        } catch (error) {
            logger.error(`[LocalFundService] getLatestNAV failed for ${schemeCode}: ${error.message}`);
            throw error;
        }
    },

    /**
     * Get NAV history from local database
     * @param {string|number} schemeCode - Scheme code
     * @param {string} startDate - Start date (optional)
     * @param {string} endDate - End date (optional)
     * @param {number} limit - Number of records (default 30)
     * @returns {Array} NAV history records
     */
    async getNAVHistory(schemeCode, startDate = null, endDate = null, limit = 30) {
        try {
            // Default to last 365 days if no dates provided
            if (!startDate) {
                const yearAgo = new Date();
                yearAgo.setDate(yearAgo.getDate() - 365);
                startDate = yearAgo.toISOString().split('T')[0];
            }
            if (!endDate) {
                endDate = new Date().toISOString().split('T')[0];
            }

            const history = await fundNavHistoryModel.getNavHistory(schemeCode, startDate, endDate, limit);

            return {
                data: history.map(n => ({
                    date: n.nav_date,
                    nav: (n.nav_value || n.nav || 0).toString()
                })),
                dataSource: 'LOCAL_DB'
            };
        } catch (error) {
            logger.error(`[LocalFundService] getNAVHistory failed for ${schemeCode}: ${error.message}`);
            throw error;
        }
    },

    /**
     * Search schemes from local database
     * @param {string} searchQuery - Search term
     * @param {number} limit - Max results (default 50)
     * @returns {Array} Matching schemes
     */
    async searchSchemes(searchQuery, limit = 50) {
        try {
            const results = await query(`
        SELECT scheme_code, scheme_name, fund_house, scheme_type, scheme_category
        FROM funds
        WHERE scheme_name LIKE ? AND is_active = 1
        ORDER BY scheme_name ASC
        LIMIT ?
      `, [`%${searchQuery}%`, limit]);

            return results.map(r => ({
                schemeCode: r.scheme_code,
                schemeName: r.scheme_name,
                fundHouse: r.fund_house,
                schemeType: r.scheme_type,
                schemeCategory: r.scheme_category
            }));
        } catch (error) {
            logger.error(`[LocalFundService] searchSchemes failed: ${error.message}`);
            throw error;
        }
    },

    /**
     * Get all schemes for a specific fund house from local database
     * @param {string} fundHouse - Fund house name
     * @returns {Array} List of schemes
     */
    async getSchemesByFundHouse(fundHouse) {
        try {
            // Get schemes from local DB
            const schemes = await query(`
        SELECT 
          f.scheme_code,
          f.scheme_name,
          f.scheme_type,
          f.scheme_category,
          f.fund_house,
          nav.nav_value as nav,
          nav.nav_date
        FROM funds f
        LEFT JOIN (
          SELECT scheme_code, nav_value, nav_date
          FROM fund_nav_history fnh1
          WHERE nav_date = (
            SELECT MAX(nav_date) 
            FROM fund_nav_history fnh2 
            WHERE fnh2.scheme_code = fnh1.scheme_code
          )
        ) nav ON f.scheme_code = nav.scheme_code
        WHERE f.fund_house LIKE ? AND f.is_active = 1
        ORDER BY f.scheme_name ASC
      `, [`%${fundHouse}%`]);

            return schemes.map(s => ({
                schemeCode: s.scheme_code,
                schemeName: s.scheme_name,
                schemeType: s.scheme_type,
                schemeCategory: s.scheme_category,
                fundHouse: s.fund_house,
                nav: s.nav ? parseFloat(s.nav).toFixed(4) : null,
                date: s.nav_date || null
            }));
        } catch (error) {
            logger.error(`[LocalFundService] getSchemesByFundHouse failed: ${error.message}`);
            throw error;
        }
    },

    /**
     * Get fund with latest NAV for holdings enrichment
     * @param {string|number} schemeCode - Scheme code
     * @returns {object} Fund with NAV data
     */
    async getFundWithNav(schemeCode) {
        try {
            const fund = await fundModel.findBySchemeCode(schemeCode);
            const latestNav = await fundNavHistoryModel.getLatestNav(schemeCode);

            return {
                scheme_code: schemeCode,
                scheme_name: fund?.scheme_name || 'Unknown',
                scheme_category: fund?.scheme_category || null,
                fund_house: fund?.fund_house || 'Unknown',
                nav: latestNav ? parseFloat(latestNav.nav) : null,
                nav_date: latestNav?.nav_date || null,
                dataSource: 'LOCAL_DB'
            };
        } catch (error) {
            logger.error(`[LocalFundService] getFundWithNav failed for ${schemeCode}: ${error.message}`);
            return {
                scheme_code: schemeCode,
                scheme_name: 'Unknown',
                nav: null,
                nav_date: null,
                dataSource: 'LOCAL_DB',
                error: error.message
            };
        }
    }
};

export default localFundService;
