import axios from 'axios';
import https from 'https';
import cacheService from './cache.service.js';

// Configuration from environment
const BASE_URL = process.env.MFAPI_BASE_URL || 'https://api.mfapi.in';
const TIMEOUT_MS = parseInt(process.env.MFAPI_TIMEOUT_MS, 10) || 15000;
const CACHE_TTL_LATEST_NAV = parseInt(process.env.CACHE_TTL_LATEST_NAV_MS, 10) || 3600000;
const CACHE_TTL_SCHEME_DETAILS = parseInt(process.env.CACHE_TTL_SCHEME_DETAILS_MS, 10) || 1800000;
const CACHE_TTL_NAV_HISTORY = parseInt(process.env.CACHE_TTL_NAV_HISTORY_MS, 10) || 21600000;

// Create HTTPS agent to handle SSL certificate issues in development
const httpsAgent = new https.Agent({
  rejectUnauthorized: process.env.NODE_ENV === 'production'
});

// Axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    'Accept': 'application/json'
  },
  httpsAgent: httpsAgent
});

/**
 * Sleep utility for retry delays
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch with retry and exponential backoff
 * @param {function} fetchFn - Function that returns a promise
 * @param {number} maxRetries - Maximum retry attempts
 * @param {number} baseDelayMs - Base delay for exponential backoff
 */
async function fetchWithRetry(fetchFn, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Exponential backoff for server errors and network issues
      if (attempt < maxRetries - 1) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.log(`[MFApi] Retry attempt ${attempt + 1} after ${delay}ms`);
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * MFApi Service - wraps MFapi.in API calls with caching and retry logic
 */
class MFApiService {
  /**
   * Search schemes by name
   * @param {string} query - Search term
   * @returns {Promise<Array>} - Array of matching schemes
   */
  async searchSchemes(query) {
    const cacheKey = `search_${query.toLowerCase()}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      console.log(`[MFApi] Cache hit for search: ${query}`);
      return cached;
    }
    
    const data = await fetchWithRetry(async () => {
      const response = await apiClient.get('/mf/search', {
        params: { q: query }
      });
      return response.data;
    });
    
    // Cache search results for 1 hour
    cacheService.set(cacheKey, data, CACHE_TTL_LATEST_NAV);
    return data;
  }

  /**
   * Get all schemes (paginated)
   * @param {number} limit - Results per page
   * @param {number} offset - Records to skip
   * @returns {Promise<Array>} - Array of schemes
   */
  async getSchemes(limit = 1000, offset = 0) {
    const cacheKey = `schemes_${limit}_${offset}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      console.log(`[MFApi] Cache hit for schemes list`);
      return cached;
    }
    
    const data = await fetchWithRetry(async () => {
      const response = await apiClient.get('/mf', {
        params: { limit, offset }
      });
      return response.data;
    });
    
    cacheService.set(cacheKey, data, CACHE_TTL_LATEST_NAV);
    return data;
  }

  /**
   * Get latest NAV for all schemes (paginated)
   * @param {number} limit - Results per page
   * @param {number} offset - Records to skip
   * @returns {Promise<Array>} - Array of latest NAV items
   */
  async getLatestNAVAll(limit = 10000, offset = 0) {
    const cacheKey = `latest_nav_all_${limit}_${offset}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      console.log(`[MFApi] Cache hit for latest NAV all`);
      return cached;
    }
    
    const data = await fetchWithRetry(async () => {
      const response = await apiClient.get('/mf/latest', {
        params: { limit, offset }
      });
      return response.data;
    });
    
    cacheService.set(cacheKey, data, CACHE_TTL_LATEST_NAV);
    return data;
  }

  /**
   * Get latest NAV for a specific scheme
   * @param {number} schemeCode - Scheme identifier
   * @returns {Promise<object>} - NAV history response with meta and data
   */
  async getLatestNAV(schemeCode) {
    const cacheKey = `latest_nav_${schemeCode}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      console.log(`[MFApi] Cache hit for latest NAV: ${schemeCode}`);
      return cached;
    }
    
    const data = await fetchWithRetry(async () => {
      const response = await apiClient.get(`/mf/${schemeCode}/latest`);
      return response.data;
    });
    
    cacheService.set(cacheKey, data, CACHE_TTL_SCHEME_DETAILS);
    return data;
  }

  /**
   * Get NAV history for a scheme
   * @param {number} schemeCode - Scheme identifier
   * @param {string} startDate - Optional start date (YYYY-MM-DD)
   * @param {string} endDate - Optional end date (YYYY-MM-DD)
   * @returns {Promise<object>} - NAV history response
   */
  async getNAVHistory(schemeCode, startDate = null, endDate = null) {
    const cacheKey = `nav_history_${schemeCode}_${startDate || 'all'}_${endDate || 'all'}`;
    const cached = cacheService.get(cacheKey);
    
    if (cached) {
      console.log(`[MFApi] Cache hit for NAV history: ${schemeCode}`);
      return cached;
    }
    
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    
    const data = await fetchWithRetry(async () => {
      const response = await apiClient.get(`/mf/${schemeCode}`, { params });
      return response.data;
    });
    
    cacheService.set(cacheKey, data, CACHE_TTL_NAV_HISTORY);
    return data;
  }

  /**
   * Get schemes filtered by fund house
   * Uses cached latest NAV data
   * @param {string} fundHouse - Fund house name
   * @returns {Promise<Array>} - Filtered schemes
   */
  async getSchemesByFundHouse(fundHouse) {
    // Fetch all latest NAV (cached)
    const allSchemes = await this.getLatestNAVAll(10000, 0);
    
    // Filter by fund house (case-insensitive partial match)
    const filtered = allSchemes.filter(scheme => 
      scheme.fundHouse && 
      scheme.fundHouse.toLowerCase().includes(fundHouse.toLowerCase())
    );
    
    return filtered;
  }

  /**
   * Get scheme details with computed performance metrics
   * @param {number} schemeCode - Scheme identifier
   * @returns {Promise<object>} - Enhanced scheme details
   */
  async getSchemeDetails(schemeCode) {
    // Get latest NAV
    const latestData = await this.getLatestNAV(schemeCode);
    
    // Get NAV history for last 180 days for performance calculation
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 180);
    
    const formatDate = (d) => d.toISOString().split('T')[0];
    
    let historyData;
    try {
      historyData = await this.getNAVHistory(
        schemeCode, 
        formatDate(startDate), 
        formatDate(endDate)
      );
    } catch (e) {
      console.log(`[MFApi] Could not fetch history for ${schemeCode}:`, e.message);
      historyData = null;
    }
    
    // Compute performance metrics
    const performance = this.computePerformance(historyData?.data || []);
    
    return {
      meta: latestData.meta,
      latestNAV: latestData.data?.[0] || null,
      history: historyData?.data?.slice(0, 30) || [], // Last 30 days for display
      performance,
      status: latestData.status
    };
  }

  /**
   * Compute performance metrics from NAV history
   * @param {Array} navData - Array of NAV records sorted newest first
   * @returns {object} - Performance metrics
   */
  computePerformance(navData) {
    if (!navData || navData.length < 2) {
      return { oneMonth: null, threeMonth: null, sixMonth: null };
    }
    
    const latestNAV = parseFloat(navData[0]?.nav);
    if (isNaN(latestNAV)) {
      return { oneMonth: null, threeMonth: null, sixMonth: null };
    }
    
    // Parse date from DD-MM-YYYY format
    const parseDate = (dateStr) => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const latestDate = parseDate(navData[0].date);
    
    // Find NAV closest to target days ago
    const findNAVDaysAgo = (daysAgo) => {
      const targetDate = new Date(latestDate);
      targetDate.setDate(targetDate.getDate() - daysAgo);
      
      let closest = null;
      let minDiff = Infinity;
      
      for (const item of navData) {
        const itemDate = parseDate(item.date);
        const diff = Math.abs(itemDate - targetDate);
        if (diff < minDiff) {
          minDiff = diff;
          closest = item;
        }
      }
      
      // Only return if within 7 days of target
      if (minDiff <= 7 * 24 * 60 * 60 * 1000) {
        return parseFloat(closest.nav);
      }
      return null;
    };
    
    const nav1m = findNAVDaysAgo(30);
    const nav3m = findNAVDaysAgo(90);
    const nav6m = findNAVDaysAgo(180);
    
    const calcReturn = (oldNAV) => {
      if (!oldNAV) return null;
      return ((latestNAV - oldNAV) / oldNAV * 100).toFixed(2);
    };
    
    return {
      oneMonth: calcReturn(nav1m),
      threeMonth: calcReturn(nav3m),
      sixMonth: calcReturn(nav6m)
    };
  }
}

export const mfApiService = new MFApiService();
export default mfApiService;
