import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { demoApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { RectangleAd, BannerAd } from '../components/AdSense';
import InvestmentPerformanceNotification from '../components/InvestmentPerformanceNotification';

export default function Portfolio() {
  const { user, demoAccount, refreshBalance, loading: authLoading, portfolioSummary } = useAuth();
  const [portfolio, setPortfolio] = useState({
    balance: 0,
    holdings: [],
    summary: { totalInvested: 0, totalCurrent: 0, totalReturns: 0, returnsPercentage: 0 }
  });
  const [transactions, setTransactions] = useState([]);
  const [systematicPlans, setSystematicPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings'); // holdings, systematic-plans, lumpsum, transactions, debt-scheme, equity-scheme, hybrid-scheme, other-scheme, investment-report
  const [showLoginNotification, setShowLoginNotification] = useState(false);

  // Check if we should show the login notification (only once per session)
  useEffect(() => {
    const shouldShow = sessionStorage.getItem('showLoginNotification');
    if (shouldShow === 'true' && portfolioSummary) {
      setShowLoginNotification(true);
      sessionStorage.removeItem('showLoginNotification'); // Clear flag
    }
  }, [portfolioSummary]);

  useEffect(() => {
    if (!authLoading && user) {
      loadPortfolioData();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [portfolioRes, transactionsRes, systematicPlansRes] = await Promise.all([
        demoApi.getPortfolio(),
        demoApi.getTransactions({ limit: 20 }),
        demoApi.getSystematicPlans()
      ]);

      // Set portfolio with fallback
      if (portfolioRes && portfolioRes.success && portfolioRes.data) {
        setPortfolio(portfolioRes.data);
      } else {
        setPortfolio({ holdings: [], summary: { totalInvested: 0, totalCurrent: 0, totalReturns: 0, returnsPercentage: 0 } });
      }

      // Set transactions with fallback
      if (transactionsRes && transactionsRes.success && transactionsRes.data) {
        setTransactions(transactionsRes.data.transactions || []);
      } else {
        setTransactions([]);
      }

      // Set systematic plans with fallback
      if (systematicPlansRes && systematicPlansRes.success && systematicPlansRes.data) {
        setSystematicPlans(systematicPlansRes.data.plans || []);
      } else {
        setSystematicPlans([]);
      }

      // Refresh balance but don't block on errors
      try {
        await refreshBalance();
      } catch (balanceErr) {
        // Silent failure for balance refresh
      }
    } catch (err) {
      setError(err.message);
      // Set empty data on error
      setPortfolio({ holdings: [], summary: { totalInvested: 0, totalCurrent: 0, totalReturns: 0, returnsPercentage: 0 } });
      setTransactions([]);
      setSystematicPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Filter functions for different tabs
  const getLumpsumTransactions = () => {
    return transactions.filter(t => t.transaction_type === 'LUMP_SUM');
  };

  // Filter by standardized scheme categories from MFAPI
  // API format: "Equity Scheme - Large Cap Fund", "Debt Scheme - Banking and PSU Fund", etc.
  const getDebtSchemes = () => {
    return portfolio.holdings?.filter(h =>
      h.scheme_category?.toLowerCase().includes('debt scheme')
    ) || [];
  };

  const getEquitySchemes = () => {
    return portfolio.holdings?.filter(h =>
      h.scheme_category?.toLowerCase().includes('equity scheme')
    ) || [];
  };

  const getHybridSchemes = () => {
    return portfolio.holdings?.filter(h =>
      h.scheme_category?.toLowerCase().includes('hybrid scheme')
    ) || [];
  };

  const getOtherSchemes = () => {
    return portfolio.holdings?.filter(h => {
      const category = h.scheme_category?.toLowerCase() || '';
      // Other schemes include everything not in Debt, Equity, or Hybrid
      // This includes: Solution Oriented Scheme, Index Funds, FoFs, Commodity, etc.
      return !category.includes('debt scheme') &&
        !category.includes('equity scheme') &&
        !category.includes('hybrid scheme');
    }) || [];
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPortfolioData} />;
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-gray-600 mb-4">Please log in to view your portfolio</p>
        <Link to="/login" className="btn-primary">
          Go to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header with decorative elements */}
      <div className="relative mb-8">
        {/* Decorative blob */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center">
                <svg className="w-10 h-10 mr-3 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                My Portfolio
              </h1>
              <p className="text-gray-600 flex items-center">
                <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Welcome back, <span className="font-semibold ml-1">{user?.fullName}</span>
              </p>
            </div>
            <Link
              to="/invest"
              className="hidden md:inline-flex items-center px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Investment
            </Link>
          </div>
        </div>
      </div>

      {/* Portfolio Summary - Two Card Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Card 1: Available Balance - Light Theme */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm border border-gray-200">
          {/* Decorative gradient orbs */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-teal-100 rounded-full blur-2xl"></div>

          <div className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-gray-600 text-xs font-medium uppercase tracking-wider">Available Balance</p>
                  <p className="text-xs text-emerald-600 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    Ready to Invest
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                {formatCurrency(demoAccount?.balance || 0)}
              </h2>
            </div>

            <Link
              to="/invest"
              className="inline-flex items-center px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold text-sm hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 cursor-pointer"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Start Investing
            </Link>
          </div>
        </div>

        {/* Card 2: Investment Summary */}
        <div className="relative overflow-hidden rounded-2xl shadow-xl bg-white/90 backdrop-blur-sm border border-gray-200">
          {/* Decorative elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-emerald-100 rounded-full blur-2xl"></div>

          <div className="relative p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl border border-emerald-200">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-900 text-sm font-semibold">Investment Summary</p>
                {portfolio?.holdings && portfolio.holdings.length > 0 && portfolio.holdings[0]?.last_nav_date && (
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <span className={`w-1.5 h-1.5 rounded-full ${portfolio?.navStatus?.unavailable ? 'bg-yellow-400' : 'bg-emerald-400'}`}></span>
                    NAV: {portfolio?.navStatus?.lastUpdate || portfolio.holdings[0]?.last_nav_date}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Total Invested */}
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <div className="w-8 h-1 bg-blue-400 rounded-full mx-auto mb-2"></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Invested</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {formatCurrency(portfolio?.summary?.totalInvested || 0)}
                </p>
              </div>

              {/* Current Value */}
              <div className="text-center p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <div className="w-8 h-1 bg-emerald-400 rounded-full mx-auto mb-2"></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Current</p>
                <p className="text-sm sm:text-base font-bold text-gray-900">
                  {formatCurrency(portfolio?.summary?.totalCurrent || 0)}
                </p>
              </div>

              {/* Returns */}
              <div className={`text-center p-3 rounded-xl border ${(portfolio?.summary?.totalReturns || 0) >= 0
                ? 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-100'
                : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-100'
                }`}>
                <div className={`w-8 h-1 rounded-full mx-auto mb-2 ${(portfolio?.summary?.totalReturns || 0) >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`}></div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Returns</p>
                <p className={`text-sm sm:text-base font-bold ${(portfolio?.summary?.totalReturns || 0) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {(portfolio?.summary?.totalReturns || 0) >= 0 ? '+' : ''}{formatCurrency(portfolio?.summary?.totalReturns || 0)}
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-bold rounded-full ${(portfolio?.summary?.totalReturns || 0) >= 0
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-rose-100 text-rose-700'
                  }`}>
                  {parseFloat(portfolio?.summary?.returnsPercentage || 0).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Section */}
      <div className="mb-8">
        <BannerAd />
      </div>

      {/* Tabs with modern design - Two Row Layout with horizontal scroll on mobile */}
      <div className="mb-6 space-y-3">
        {/* First Row: Holdings, Systematic Plans, Lumpsum, Transactions */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveTab('holdings')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'holdings'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="sm:hidden">Hold</span>
              <span className="hidden sm:inline">Holdings</span>
              <span className="ml-1">({portfolio?.holdings?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('systematic-plans')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'systematic-plans'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="sm:hidden">SIP</span>
              <span className="hidden sm:inline">Systematic Plans</span>
              <span className="ml-1">({systematicPlans?.length || 0})</span>
            </button>
            <button
              onClick={() => setActiveTab('lumpsum')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'lumpsum'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              Lump ({getLumpsumTransactions().length})
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'transactions'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span className="sm:hidden">Txns</span>
              <span className="hidden sm:inline">Transactions</span>
              <span className="ml-1">({transactions?.length || 0})</span>
            </button>
          </div>
        </div>

        {/* Second Row: Debt, Equity, Hybrid, Other, Investment Report */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-2 overflow-x-auto scrollbar-hide">
          <div className="flex gap-2 min-w-max">
            <button
              onClick={() => setActiveTab('debt-scheme')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'debt-scheme'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
              Debt ({getDebtSchemes().length})
            </button>
            <button
              onClick={() => setActiveTab('equity-scheme')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'equity-scheme'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              Equity ({getEquitySchemes().length})
            </button>
            <button
              onClick={() => setActiveTab('hybrid-scheme')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'hybrid-scheme'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
              Hybrid ({getHybridSchemes().length})
            </button>
            <button
              onClick={() => setActiveTab('other-scheme')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'other-scheme'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
              Other ({getOtherSchemes().length})
            </button>
            <button
              onClick={() => setActiveTab('investment-report')}
              className={`flex items-center px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 rounded-lg font-semibold text-xs sm:text-sm transition-all duration-200 whitespace-nowrap ${activeTab === 'investment-report'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="sm:hidden">Report</span>
              <span className="hidden sm:inline">Investment Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            portfolio.holdings.map((holding) => (
              <div
                key={holding.id}
                className="group card-premium card-premium-hover p-6 animate-fade-in-up"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mr-4 group-hover:from-emerald-200 group-hover:to-teal-200 transition-colors">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                          {holding.scheme_name}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center">
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                          </svg>
                          Scheme Code: {holding.scheme_code}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${(holding.returns || 0) >= 0
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                      }`}>
                      {(holding.returns || 0) >= 0 ? (
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                        </svg>
                      )}
                      {(holding.returns || 0) >= 0 ? '+' : ''}
                      {formatCurrency(holding.returns || 0)}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${(holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                      ({parseFloat(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <p className="text-xs text-gray-600 font-medium">Units</p>
                    </div>
                    <p className="font-bold text-gray-900">{parseFloat(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                      </svg>
                      <p className="text-xs text-emerald-700 font-medium">Invested</p>
                    </div>
                    <p className="font-bold text-emerald-900">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-xs text-purple-700 font-medium">Invested NAV</p>
                    </div>
                    <p className="font-bold text-purple-900">₹{parseFloat(holding.invested_nav || 0).toFixed(4)}</p>
                    {holding.created_at && (
                      <p className="text-xs text-purple-600 mt-0.5">{formatDate(holding.created_at)}</p>
                    )}
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      <p className="text-xs text-blue-700 font-medium">Current Value</p>
                    </div>
                    <p className="font-bold text-blue-900">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-50 to-teal-100 rounded-lg p-3">
                    <div className="flex items-center mb-1">
                      <svg className="w-4 h-4 mr-1 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <p className="text-xs text-teal-700 font-medium">Latest NAV</p>
                    </div>
                    <p className="font-bold text-teal-900">₹{parseFloat(holding.last_nav || 0).toFixed(4)}</p>
                    {holding.last_nav_date && (
                      <p className="text-xs text-teal-600 mt-0.5">{holding.last_nav_date}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Holdings Yet</h3>
              <p className="text-gray-600 mb-6">Start your investment journey today</p>
              <Link
                to="/invest"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Start Investing
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {transactions && transactions.length > 0 ? (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Fund</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Type</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">NAV</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-emerald-900 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {transactions.map((txn) => (
                      <tr key={txn.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatDate(txn.executed_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate font-medium">{txn.scheme_name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-100 text-emerald-800">
                            {txn.transaction_type}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                          {parseFloat(txn.units || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                          ₹{parseFloat(txn.nav || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {transactions.map((txn) => (
                  <div key={txn.id} className="card-premium p-4 space-y-3">
                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                      <div>
                        <p className="text-xs text-gray-500 font-medium">{formatDate(txn.executed_at)}</p>
                        <h4 className="text-sm font-bold text-gray-900 leading-tight mt-1">{txn.scheme_name}</h4>
                      </div>
                      <span className={`px-2 py-1 text-[10px] font-bold rounded-lg ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {txn.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Amount</p>
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(txn.amount)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Type</p>
                        <p className="text-sm font-semibold text-emerald-700">{txn.transaction_type}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">Units</p>
                        <p className="text-sm font-medium text-gray-700">{parseFloat(txn.units || 0).toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wider">NAV</p>
                        <p className="text-sm font-medium text-gray-700">₹{parseFloat(txn.nav || 0).toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Transactions Yet</h3>
              <p className="text-gray-600">Your transaction history will appear here</p>
            </div>
          )}
        </div>
      )}

      {/* Systematic Plans Tab */}
      {activeTab === 'systematic-plans' && (
        <div className="space-y-4">
          {systematicPlans && systematicPlans.length > 0 ? (
            systematicPlans.map((plan) => (
              <div
                key={plan.id}
                className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg mr-3 ${plan.transaction_type === 'SIP'
                          ? 'bg-blue-100 text-blue-800'
                          : plan.transaction_type === 'STP'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-orange-100 text-orange-800'
                          }`}>
                          {plan.transaction_type}
                        </span>
                        <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg ${plan.frequency === 'DAILY'
                          ? 'bg-emerald-100 text-emerald-800'
                          : plan.frequency === 'WEEKLY'
                            ? 'bg-teal-100 text-teal-800'
                            : plan.frequency === 'MONTHLY'
                              ? 'bg-indigo-100 text-indigo-800'
                              : plan.frequency === 'QUARTERLY'
                                ? 'bg-violet-100 text-violet-800'
                                : 'bg-pink-100 text-pink-800'
                          }`}>
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {plan.frequency}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {plan.scheme_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Scheme Code: {plan.scheme_code}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg ${plan.status === 'SUCCESS'
                        ? 'bg-green-100 text-green-800'
                        : plan.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                        }`}>
                        {plan.status === 'SUCCESS' && (
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {plan.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-200">
                    <div>
                      <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        Amount
                      </p>
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(plan.amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Units
                      </p>
                      <p className="text-lg font-bold text-gray-900">{parseFloat(plan.units || 0).toFixed(4)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Start Date
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {plan.start_date ? formatDate(plan.start_date) : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Installments
                      </p>
                      <p className="text-sm font-semibold text-gray-900">
                        {plan.installments ? `${plan.installments} times` : 'Ongoing'}
                      </p>
                    </div>
                  </div>

                  {plan.end_date && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-600 flex items-center">
                        <svg className="w-4 h-4 mr-1 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        End Date: <span className="font-semibold ml-1">{formatDate(plan.end_date)}</span>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Systematic Plans Yet</h3>
              <p className="text-gray-600 mb-6">Start a SIP, STP, or SWP to see them here</p>
              <Link
                to="/invest"
                className="inline-flex items-center px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold hover:from-emerald-600 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Start a Plan
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Lumpsum Tab */}
      {activeTab === 'lumpsum' && (
        <div className="space-y-4">
          {getLumpsumTransactions().length > 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-emerald-900 uppercase tracking-wider">Scheme Name</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">Amount</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">Units</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-emerald-900 uppercase tracking-wider">NAV</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-emerald-900 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {getLumpsumTransactions().map((txn) => (
                      <tr key={txn.id} className="hover:bg-emerald-50/50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {formatDate(txn.executed_at)}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs truncate font-medium" title={txn.scheme_name}>
                            {txn.scheme_name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                          {formatCurrency(txn.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 font-medium">
                          {parseFloat(txn.units || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700 font-medium">
                          ₹{parseFloat(txn.nav || 0).toFixed(4)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-lg ${txn.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                            {txn.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Lumpsum Investments Yet</h3>
              <p className="text-gray-600">Make a one-time investment to see it here</p>
            </div>
          )}
        </div>
      )}

      {/* Debt Scheme Tab */}
      {activeTab === 'debt-scheme' && (
        <div className="space-y-4">
          {getDebtSchemes().length > 0 ? (
            getDebtSchemes().map((holding) => (
              <div key={holding.id} className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{holding.scheme_name}</h3>
                        <p className="text-sm text-gray-500">Scheme Code: {holding.scheme_code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${(holding.returns || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(holding.returns || 0) >= 0 ? '+' : ''}{formatCurrency(holding.returns || 0)}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${(holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({parseFloat(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Units</p>
                    <p className="font-bold text-gray-900">{parseFloat(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-medium mb-1">Invested</p>
                    <p className="font-bold text-emerald-900">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Current Value</p>
                    <p className="font-bold text-blue-900">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <p className="text-xs text-purple-700 font-medium mb-1">Last NAV</p>
                    <p className="font-bold text-purple-900">₹{parseFloat(holding.last_nav || 0).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Debt Scheme Investments</h3>
              <p className="text-gray-600">Invest in debt schemes to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Equity Scheme Tab */}
      {activeTab === 'equity-scheme' && (
        <div className="space-y-4">
          {getEquitySchemes().length > 0 ? (
            getEquitySchemes().map((holding) => (
              <div key={holding.id} className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{holding.scheme_name}</h3>
                        <p className="text-sm text-gray-500">Scheme Code: {holding.scheme_code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${(holding.returns || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(holding.returns || 0) >= 0 ? '+' : ''}{formatCurrency(holding.returns || 0)}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${(holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({parseFloat(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Units</p>
                    <p className="font-bold text-gray-900">{parseFloat(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-medium mb-1">Invested</p>
                    <p className="font-bold text-emerald-900">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Current Value</p>
                    <p className="font-bold text-blue-900">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <p className="text-xs text-purple-700 font-medium mb-1">Last NAV</p>
                    <p className="font-bold text-purple-900">₹{parseFloat(holding.last_nav || 0).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Equity Scheme Investments</h3>
              <p className="text-gray-600">Invest in equity schemes to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Hybrid Scheme Tab */}
      {activeTab === 'hybrid-scheme' && (
        <div className="space-y-4">
          {getHybridSchemes().length > 0 ? (
            getHybridSchemes().map((holding) => (
              <div key={holding.id} className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{holding.scheme_name}</h3>
                        <p className="text-sm text-gray-500">Scheme Code: {holding.scheme_code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${(holding.returns || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(holding.returns || 0) >= 0 ? '+' : ''}{formatCurrency(holding.returns || 0)}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${(holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({parseFloat(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Units</p>
                    <p className="font-bold text-gray-900">{parseFloat(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-medium mb-1">Invested</p>
                    <p className="font-bold text-emerald-900">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Current Value</p>
                    <p className="font-bold text-blue-900">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <p className="text-xs text-purple-700 font-medium mb-1">Last NAV</p>
                    <p className="font-bold text-purple-900">₹{parseFloat(holding.last_nav || 0).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Hybrid Scheme Investments</h3>
              <p className="text-gray-600">Invest in hybrid schemes to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Other Scheme Tab */}
      {activeTab === 'other-scheme' && (
        <div className="space-y-4">
          {getOtherSchemes().length > 0 ? (
            getOtherSchemes().map((holding) => (
              <div key={holding.id} className="group bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-xl flex items-center justify-center mr-4">
                        <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">{holding.scheme_name}</h3>
                        <p className="text-sm text-gray-500">Scheme Code: {holding.scheme_code}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`inline-flex items-center px-4 py-2 rounded-xl font-bold text-lg ${(holding.returns || 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {(holding.returns || 0) >= 0 ? '+' : ''}{formatCurrency(holding.returns || 0)}
                    </div>
                    <div className={`mt-1 text-sm font-semibold ${(holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({parseFloat(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-3">
                    <p className="text-xs text-gray-600 font-medium mb-1">Units</p>
                    <p className="font-bold text-gray-900">{parseFloat(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-3">
                    <p className="text-xs text-emerald-700 font-medium mb-1">Invested</p>
                    <p className="font-bold text-emerald-900">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3">
                    <p className="text-xs text-blue-700 font-medium mb-1">Current Value</p>
                    <p className="font-bold text-blue-900">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3">
                    <p className="text-xs text-purple-700 font-medium mb-1">Last NAV</p>
                    <p className="font-bold text-purple-900">₹{parseFloat(holding.last_nav || 0).toFixed(4)}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-cyan-100 to-teal-100 rounded-full mb-6">
                <svg className="w-10 h-10 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">No Other Scheme Investments</h3>
              <p className="text-gray-600">Invest in other schemes to see them here</p>
            </div>
          )}
        </div>
      )}

      {/* Investment Report Tab - Coming Soon */}
      {activeTab === 'investment-report' && (
        <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
            <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">Coming Soon</h3>
          <p className="text-gray-600 text-lg mb-6">We're working on comprehensive investment reports to give you detailed insights into your portfolio performance.</p>
          <div className="inline-flex items-center space-x-2 text-emerald-600 font-semibold">
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Feature in development</span>
          </div>
        </div>
      )}

      {/* Login Performance Notification */}
      {showLoginNotification && portfolioSummary && (
        <InvestmentPerformanceNotification
          portfolioSummary={portfolioSummary}
          onClose={() => setShowLoginNotification(false)}
        />
      )}
    </div>
  );
}
