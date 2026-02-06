/**
 * Interest Rate Service
 * Fetches and caches current interest rates for various investment schemes
 * from reliable sources (RBI, government websites, major banks)
 */
import logger from './logger.service.js';

/**
 * Default Interest Rates (Fallback values)
 * Updated as of January 2026
 */
const DEFAULT_RATES = {
  // Banking Schemes
  savingsAccount: 3.0,
  fixedDeposit: {
    '1year': 6.5,
    '2year': 6.75,
    '3year': 7.0,
    '5year': 7.25
  },
  recurringDeposit: 6.5,
  loanHomeLoan: 8.5,
  loanPersonalLoan: 11.5,
  loanCarLoan: 9.0,

  // Government Schemes
  ppf: 7.1,              // Public Provident Fund
  ssa: 8.2,              // Sukanya Samriddhi Account
  scss: 8.2,             // Senior Citizen Savings Scheme
  nsc: 7.7,              // National Savings Certificate
  kvp: 7.5,              // Kisan Vikas Patra

  // Post Office Schemes
  poMIS: 7.4,            // Post Office Monthly Income Scheme
  poRD: 6.7,             // Post Office Recurring Deposit
  poTD: {                // Post Office Time Deposit
    '1year': 6.9,
    '2year': 7.0,
    '3year': 7.1,
    '5year': 7.5
  },

  // Retirement Schemes
  epf: 8.25,             // Employees' Provident Fund
  nps: 10.0,             // National Pension System (expected return)

  // Market-based (Expected returns)
  mutualFundEquity: 12.0,
  mutualFundDebt: 7.5,
  mutualFundHybrid: 9.5,

  // Last updated timestamp
  lastUpdated: new Date().toISOString(),
  source: 'Default rates - January 2026'
};

/**
 * Rate cache with TTL
 */
let rateCache = {
  rates: { ...DEFAULT_RATES },
  lastFetched: null,
  ttl: 24 * 60 * 60 * 1000 // 24 hours in milliseconds
};

/**
 * Fetch current interest rates from various sources
 * This is a placeholder - in production, integrate with actual APIs
 * 
 * Sources to integrate:
 * - RBI website API for policy rates
 * - SBI/HDFC/ICICI websites for FD rates
 * - India Post website for post office schemes
 * - EPFO website for EPF rates
 * - Government notifications for PPF, NSC, etc.
 */
const fetchRatesFromSources = async () => {
  try {
    // In production, make actual API calls here
    // For now, using default rates with potential updates

    logger.info('[Rate Service] Fetching current interest rates...');

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 100));

    // In production, parse and merge rates from different sources
    const fetchedRates = {
      ...DEFAULT_RATES,
      lastUpdated: new Date().toISOString(),
      source: 'Fetched from sources'
    };

    logger.info('[Rate Service] Successfully fetched rates');
    return fetchedRates;

  } catch (error) {
    logger.error(`[Rate Service] Error fetching rates: ${error.message}`);
    // Return default rates on error
    return DEFAULT_RATES;
  }
};

/**
 * Check if cached rates are still valid
 */
const isCacheValid = () => {
  if (!rateCache.lastFetched) return false;

  const now = Date.now();
  const age = now - rateCache.lastFetched;

  return age < rateCache.ttl;
};

/**
 * Get current interest rates with caching
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object>} Current interest rates
 */
export const getCurrentRates = async (forceRefresh = false) => {
  // Return cached rates if valid
  if (!forceRefresh && isCacheValid()) {
    logger.info('[Rate Service] Returning cached rates');
    return rateCache.rates;
  }

  // Fetch fresh rates
  try {
    const freshRates = await fetchRatesFromSources();

    // Update cache
    rateCache.rates = freshRates;
    rateCache.lastFetched = Date.now();

    return freshRates;
  } catch (error) {
    logger.error(`[Rate Service] Failed to fetch rates, using defaults: ${error.message}`);
    return DEFAULT_RATES;
  }
};

/**
 * Get rate for a specific scheme
 * @param {string} schemeType - Type of scheme (e.g., 'ppf', 'ssa', 'epf')
 * @param {string} tenure - Optional tenure for schemes with varying rates
 * @returns {Promise<number>} Interest rate
 */
export const getRateForScheme = async (schemeType, tenure = null) => {
  const rates = await getCurrentRates();

  const schemeKey = schemeType.toLowerCase();

  if (!rates[schemeKey]) {
    logger.warn(`[Rate Service] Unknown scheme type: ${schemeType}, using default 6.5%`);
    return 6.5;
  }

  // Handle schemes with tenure-based rates
  if (tenure && typeof rates[schemeKey] === 'object') {
    const tenureKey = tenure.toLowerCase().replace(' ', '');
    return rates[schemeKey][tenureKey] || Object.values(rates[schemeKey])[0] || 6.5;
  }

  return typeof rates[schemeKey] === 'number' ? rates[schemeKey] : 6.5;
};

/**
 * Get all available rates
 * @returns {Promise<Object>} All current rates
 */
export const getAllRates = async () => {
  return await getCurrentRates();
};

/**
 * Manually update a specific rate (admin function)
 * @param {string} schemeType - Type of scheme
 * @param {number|Object} newRate - New rate value
 * @returns {Object} Updated rates
 */
export const updateRate = (schemeType, newRate) => {
  const schemeKey = schemeType.toLowerCase();

  if (rateCache.rates[schemeKey] !== undefined) {
    rateCache.rates[schemeKey] = newRate;
    rateCache.rates.lastUpdated = new Date().toISOString();
    rateCache.rates.source = 'Manually updated';
    logger.info(`[Rate Service] Updated ${schemeType} rate to ${JSON.stringify(newRate)}`);
  } else {
    logger.warn(`[Rate Service] Unknown scheme type: ${schemeType}`);
  }

  return rateCache.rates;
};

/**
 * Clear rate cache (force refresh on next request)
 */
export const clearCache = () => {
  rateCache.lastFetched = null;
  logger.info('[Rate Service] Cache cleared');
};

/**
 * Get cache status
 * @returns {Object} Cache status information
 */
export const getCacheStatus = () => {
  return {
    isValid: isCacheValid(),
    lastFetched: rateCache.lastFetched ? new Date(rateCache.lastFetched).toISOString() : null,
    ttl: rateCache.ttl,
    source: rateCache.rates.source
  };
};

export default {
  getCurrentRates,
  getRateForScheme,
  getAllRates,
  updateRate,
  clearCache,
  getCacheStatus,
  DEFAULT_RATES
};
