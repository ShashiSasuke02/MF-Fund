import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { amcApi } from '../api';
import { PageLoader, TableRowSkeleton } from '../components/LoadingSpinner';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import { InFeedAd, BannerAd, DisplayAd } from '../components/AdSense';

/**
 * Fund List page - displays all funds for a specific AMC
 */
export default function FundList() {
  const { fundHouse } = useParams();
  const decodedFundHouse = decodeURIComponent(fundHouse);

  const [fundsData, setFundsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('name_asc');

  const fetchFunds = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await amcApi.getFunds(decodedFundHouse, { search, category, sort });
      setFundsData(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunds();
  }, [decodedFundHouse, search, category, sort]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BackButton />
        <ErrorMessage message={error} onRetry={fetchFunds} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden">
      {/* Animated decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button */}
        <BackButton />

        {/* Banner Ad */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <BannerAd />
        </div>

        {/* Header with gradient */}
        <div className="mb-10">
          <div className="inline-flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 mb-4">
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-semibold text-emerald-700">Fund House</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent mb-3">
            {decodedFundHouse}
          </h1>
          <p className="text-lg text-gray-600 font-medium flex items-center">
            <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {loading ? 'Loading schemes...' : `${fundsData?.totalCount || 0} mutual fund schemes available`}
          </p>
        </div>

        {/* Filters with modern styling */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 mb-8">
          <div className="p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:gap-4">
              {/* Search */}
              <div className="w-full">
                <div className="relative">
                  <div className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Search schemes..."
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full pl-14 sm:pl-16 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm sm:text-base"
                  />
                </div>
              </div>

              {/* Category & Sort Row */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                {/* Category Filter */}
                <div className="w-full sm:w-1/2 lg:w-64">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                      </svg>
                    </div>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base"
                    >
                      <option value="">All Categories</option>
                      {fundsData?.categories?.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Sort */}
                <div className="w-full sm:w-1/2 lg:w-56">
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                      </svg>
                    </div>
                    <select
                      value={sort}
                      onChange={(e) => setSort(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white text-sm sm:text-base"
                    >
                      <option value="name_asc">Name (A-Z)</option>
                      <option value="name_desc">Name (Z-A)</option>
                      <option value="nav_desc">NAV (High-Low)</option>
                      <option value="nav_asc">NAV (Low-High)</option>
                    </select>
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Scheme Name</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">NAV</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {loading ? (
                    Array.from({ length: 10 }).map((_, i) => <TableRowSkeleton key={i} columns={5} />)
                  ) : fundsData?.schemes?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12">
                        <EmptyState title="No schemes found" message={search ? `No schemes matching "${search}"` : "No schemes available"} />
                      </td>
                    </tr>
                  ) : (
                    <>
                      {fundsData?.schemes?.map((scheme) => <FundRow key={scheme.schemeCode} scheme={scheme} />)}
                      {fundsData?.schemes?.length > 10 && (
                        <tr><td colSpan="5" className="px-6 py-4"><InFeedAd /></td></tr>
                      )}
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-32 w-full rounded-xl" />)
            ) : fundsData?.schemes?.length === 0 ? (
              <div className="bg-white/90 p-8 rounded-2xl border border-gray-200 text-center">
                <EmptyState title="No schemes found" message={search ? `No schemes matching "${search}"` : "No schemes available"} />
              </div>
            ) : (
              fundsData?.schemes?.map((scheme) => (
                <div key={scheme.schemeCode} className="card-premium p-5 space-y-4">
                  <div>
                    <h4 className="text-base font-bold text-gray-900 leading-tight mb-2">{scheme.schemeName}</h4>
                    <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-wider">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-1 rounded-md">{scheme.schemeCategory}</span>
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-md">#{scheme.schemeCode}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-0.5">Latest NAV</p>
                      <p className="text-xl font-bold text-emerald-600">₹{parseFloat(scheme.nav).toFixed(2)}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5">{formatDate(scheme.date)}</p>
                    </div>
                    <Link
                      to={`/fund/${scheme.schemeCode}`}
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-md transition-all active:scale-95"
                    >
                      Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Display Ad */}
        <div className="mt-8 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <DisplayAd />
        </div>
      </div>
    </div>
  );
}

/**
 * Format date string to readable format
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

/**
 * Individual fund row component
 */
function FundRow({ scheme }) {
  return (
    <tr className="hover:bg-emerald-50/50 transition-all duration-200 border-b border-gray-100 group">
      <td className="px-6 py-4">
        <div className="max-w-md">
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-emerald-700 transition-colors" title={scheme.schemeName}>
            {scheme.schemeName}
          </p>
          <div className="flex items-center mt-1.5">
            <svg className="w-3.5 h-3.5 text-gray-400 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
            </svg>
            <p className="text-xs text-gray-500">
              {scheme.schemeCode}
            </p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200">
          {scheme.schemeCategory || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
          <svg className="w-4 h-4 text-emerald-700 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          <span className="text-sm font-bold text-emerald-900">
            {parseFloat(scheme.nav).toFixed(2)}
          </span>
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center text-sm text-gray-600">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatDate(scheme.date)}
        </div>
      </td>
      <td className="px-6 py-4 text-center">
        <Link
          to={`/fund/${scheme.schemeCode}`}
          className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:scale-105"
        >
          View Details
          <svg className="w-4 h-4 ml-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </td>
    </tr>
  );
}

/**
 * Back button component
 */
function BackButton() {
  return (
    <Link
      to="/browse"
      className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 hover:border-emerald-300 rounded-lg mb-6 group transition-all shadow-sm hover:shadow-md"
    >
      <svg className="w-4 h-4 mr-2 text-emerald-600 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to AMCs
    </Link>
  );
}
