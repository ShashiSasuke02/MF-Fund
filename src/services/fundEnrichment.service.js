import axios from 'axios';
import logger from './logger.service.js';

class FundEnrichmentService {
    constructor() {
        this.client = axios.create({
            baseURL: 'https://mf.captnemo.in/kuvera',
            timeout: 5000,
            headers: {
                'User-Agent': 'MF-Investments-App/1.0',
                'Accept': 'application/json'
            }
        });
    }

    /**
     * Fetch additional details for a fund by ISIN
     * @param {string} isin - The ISIN of the fund
     * @param {string} requestId - Context Request ID for logging
     * @returns {Promise<Object|null>} - Enriched data or null
     */
    async fetchFundDetails(isin, requestId) {
        if (!isin) {
            logger.warn('Skipping enrichment: No ISIN provided', { requestId });
            return null;
        }

        try {
            logger.info(`Fetching external data for ISIN: ${isin}`, { requestId, service: 'CaptainNemo' });

            const response = await this.client.get(`/${isin}`);

            if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
                logger.warn(`External API returned invalid data for ${isin}`, { requestId });
                return null;
            }

            // API returns an array [ { ... } ]
            const data = Array.isArray(response.data) ? response.data[0] : response.data;

            const enrichedData = {
                // Parse currency strings if needed, though they seem to be Numbers in Kuvera endpoint
                aum: this._parseCurrency(data.aum),
                expense_ratio: data.expense_ratio ? String(data.expense_ratio) : null,
                risk_level: data.crisil_rating || data.risk_level || 'Moderate',

                // Return percentages
                returns_1y: data.returns?.year_1 ? parseFloat(data.returns.year_1) : null,
                returns_3y: data.returns?.year_3 ? parseFloat(data.returns.year_3) : null,
                returns_5y: data.returns?.year_5 ? parseFloat(data.returns.year_5) : null,

                min_lumpsum: data.lump_min ? parseFloat(data.lump_min) : null,
                min_sip: data.sip_min ? parseFloat(data.sip_min) : null,
                fund_manager: data.fund_manager,

                // [NEW] Additional Enrichment Fields
                investment_objective: data.investment_objective || null,
                fund_start_date: data.start_date || null,

                // Also capture NAV if useful, though sync job handles it
                latest_nav: data.nav ? parseFloat(data.nav.nav) : null,
                latest_nav_date: data.nav ? data.nav.date : null,

                detail_info_synced_at: Date.now()
            };

            logger.info(`Successfully enriched data for ${isin}`, { requestId });
            return enrichedData;

        } catch (error) {
            if (error.response?.status === 404) {
                logger.warn(`Fund details not found on external API for ${isin}`, { requestId, status: 404 });
            } else {
                logger.error(`Failed to fetch enrichment data for ${isin}: ${error.message}`, {
                    requestId,
                    stack: error.stack
                });
            }
            return null;
        }
    }

    _parseCurrency(value) {
        if (!value) return null;
        if (typeof value === 'number') return value;
        const cleanStr = value.replace(/,/g, '').replace(/Cr/i, '').trim();
        return parseFloat(cleanStr);
    }
}

export default new FundEnrichmentService();
