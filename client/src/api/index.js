/**
 * API client for backend communication
 */
const API_BASE = '/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken() {
  return localStorage.getItem('auth_token');
}

/**
 * Set auth token in localStorage
 */
export function setAuthToken(token) {
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

/**
 * Generic fetch wrapper with error handling
 */
async function fetchApi(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Add auth token if available
  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      headers,
      ...options
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP error ${response.status}`);
    }
    
    return data;
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('Network error. Please check your connection.');
    }
    throw error;
  }
}

/**
 * AMC API functions
 */
export const amcApi = {
  /**
   * Get all AMCs
   */
  getAll: () => fetchApi('/amcs'),

  /**
   * Get single AMC by fund house name
   */
  getOne: (fundHouse) => fetchApi(`/amcs/${encodeURIComponent(fundHouse)}`),

  /**
   * Get funds for a specific AMC
   */
  getFunds: (fundHouse, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.search) searchParams.set('search', params.search);
    if (params.category) searchParams.set('category', params.category);
    if (params.sort) searchParams.set('sort', params.sort);
    
    const queryString = searchParams.toString();
    const endpoint = `/amcs/${encodeURIComponent(fundHouse)}/funds${queryString ? `?${queryString}` : ''}`;
    return fetchApi(endpoint);
  }
};

/**
 * Fund API functions
 */
export const fundApi = {
  /**
   * Search funds by name
   */
  search: (query) => fetchApi(`/funds/search?q=${encodeURIComponent(query)}`),

  /**
   * Get fund details
   */
  getDetails: (schemeCode) => fetchApi(`/funds/${schemeCode}`),

  /**
   * Get latest NAV for a fund
   */
  getLatestNAV: (schemeCode) => fetchApi(`/funds/${schemeCode}/nav`),

  /**
   * Get NAV history for a fund
   */
  getHistory: (schemeCode, params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.startDate) searchParams.set('startDate', params.startDate);
    if (params.endDate) searchParams.set('endDate', params.endDate);
    if (params.limit) searchParams.set('limit', params.limit);
    
    const queryString = searchParams.toString();
    const endpoint = `/funds/${schemeCode}/history${queryString ? `?${queryString}` : ''}`;
    return fetchApi(endpoint);
  }
};

/**
 * Health API functions
 */
export const healthApi = {
  /**
   * Check server health
   */
  check: () => fetchApi('/health'),

  /**
   * Get cache stats
   */
  getCacheStats: () => fetchApi('/health/cache')
};

/**
 * Auth API functions
 */
export const authApi = {
  /**
   * Register new user
   */
  register: (userData) => 
    fetchApi('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    }),

  /**
   * Login user
   */
  login: (credentials) => 
    fetchApi('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),

  /**
   * Get current user profile
   */
  getProfile: () => fetchApi('/auth/profile'),

  /**
   * Logout (clear local token)
   */
  logout: () => {
    setAuthToken(null);
  }
};

/**
 * Demo Account API functions
 */
export const demoApi = {
  /**
   * Get portfolio with holdings
   */
  getPortfolio: () => fetchApi('/demo/portfolio'),

  /**
   * Get demo balance
   */
  getBalance: () => fetchApi('/demo/balance'),

  /**
   * Create transaction
   */
  createTransaction: (transactionData) =>
    fetchApi('/demo/transactions', {
      method: 'POST',
      body: JSON.stringify(transactionData)
    }),

  /**
   * Get transaction history
   */
  getTransactions: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.limit) searchParams.set('limit', params.limit);
    if (params.offset) searchParams.set('offset', params.offset);
    
    const queryString = searchParams.toString();
    return fetchApi(`/demo/transactions${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Get active systematic plans (SIP, STP, SWP)
   */
  getSystematicPlans: () => fetchApi('/demo/systematic-plans')
};

/**
 * Calculator API functions
 */
export const calculatorApi = {
  /**
   * Get current interest rates
   */
  getInterestRates: async (forceRefresh = false) => {
    const response = await fetchApi(`/calculator/rates${forceRefresh ? '?forceRefresh=true' : ''}`);
    return response.data.rates;
  },

  /**
   * Calculate Simple Interest
   */
  calculateSimpleInterest: (data) =>
    fetchApi('/calculator/simple-interest', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Compound Interest
   */
  calculateCompoundInterest: (data) =>
    fetchApi('/calculator/compound-interest', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Basic Loan EMI
   */
  calculateBasicLoan: (data) =>
    fetchApi('/calculator/loan-basic', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Advanced Loan with Prepayment
   */
  calculateAdvancedLoan: (data) =>
    fetchApi('/calculator/loan-advanced', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Fixed Deposit - Interest Payout
   */
  calculateFDPayout: (data) =>
    fetchApi('/calculator/fd-payout', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Fixed Deposit - Cumulative
   */
  calculateFDCumulative: (data) =>
    fetchApi('/calculator/fd-cumulative', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Recurring Deposit
   */
  calculateRD: (data) =>
    fetchApi('/calculator/rd', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Public Provident Fund
   */
  calculatePPF: (data) =>
    fetchApi('/calculator/ppf', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Sukanya Samriddhi Account
   */
  calculateSSA: (data) =>
    fetchApi('/calculator/ssa', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Senior Citizen Savings Scheme
   */
  calculateSCSS: (data) =>
    fetchApi('/calculator/scss', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Post Office Monthly Income Scheme
   */
  calculatePOMIS: (data) =>
    fetchApi('/calculator/po-mis', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Post Office Recurring Deposit
   */
  calculatePORD: (data) =>
    fetchApi('/calculator/po-rd', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Post Office Time Deposit
   */
  calculatePOTD: (data) =>
    fetchApi('/calculator/po-td', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate National Savings Certificate
   */
  calculateNSC: (data) =>
    fetchApi('/calculator/nsc', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate SIP
   */
  calculateSIP: (data) =>
    fetchApi('/calculator/sip', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate SWP
   */
  calculateSWP: (data) =>
    fetchApi('/calculator/swp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate STP
   */
  calculateSTP: (data) =>
    fetchApi('/calculator/stp', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate National Pension System
   */
  calculateNPS: (data) =>
    fetchApi('/calculator/nps', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Employees' Provident Fund
   */
  calculateEPF: (data) =>
    fetchApi('/calculator/epf', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  /**
   * Calculate Atal Pension Yojana
   */
  calculateAPY: (data) =>
    fetchApi('/calculator/apy', {
      method: 'POST',
      body: JSON.stringify(data)
    })
};

export default { amcApi, fundApi, healthApi, authApi, demoApi, calculatorApi };
