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

export default { amcApi, fundApi, healthApi, authApi, demoApi };
