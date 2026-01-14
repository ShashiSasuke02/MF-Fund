import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { amcApi } from '../api';
import { PageLoader, TableRowSkeleton } from '../components/LoadingSpinner';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import { InFeedAd } from '../components/AdSense';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button */}
      <BackButton />

      {/* Header with gradient */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          {decodedFundHouse}
        </h1>
        <p className="text-lg text-gray-100 font-medium">
          {loading ? 'Loading schemes...' : `${fundsData?.totalCount || 0} mutual fund schemes available`}
        </p>
      </div>

      {/* Filters with modern styling */}
      <div className="card mb-8 shadow-2xl">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search schemes..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="sm:w-64">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select"
              >
                <option value="">All Categories</option>
                {fundsData?.categories?.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Sort */}
            <div className="sm:w-48">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="select"
              >
                <option value="name_asc">Name (A-Z)</option>
                <option value="name_desc">Name (Z-A)</option>
                <option value="nav_desc">NAV (High-Low)</option>
                <option value="nav_asc">NAV (Low-High)</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Funds Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Scheme Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  NAV
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                // Loading skeletons
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={5} />
                ))
              ) : fundsData?.schemes?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState
                      title="No schemes found"
                      message={search ? `No schemes matching "${search}"` : "No schemes available for this AMC"}
                    />
                  </td>
                </tr>
              ) : (
                <>
                  {fundsData?.schemes?.map((scheme, index) => (
                    <FundRow key={scheme.schemeCode} scheme={scheme} />
                  ))}
                  {/* In-feed Ad after every 10 funds */}
                  {fundsData?.schemes?.length > 10 && (
                    <tr>
                      <td colSpan="5" className="px-6 py-4">
                        <InFeedAd />
                      </td>
                    </tr>
                  )}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/**
 * Individual fund row component
 */
function FundRow({ scheme }) {
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4">
        <div className="max-w-md">
          <p className="text-sm font-medium text-gray-900 truncate" title={scheme.schemeName}>
            {scheme.schemeName}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Code: {scheme.schemeCode}
          </p>
        </div>
      </td>
      <td className="px-6 py-4">
        <span className="badge-blue text-xs">
          {scheme.schemeCategory || 'N/A'}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        <span className="text-sm font-semibold text-gray-900">
          ₹{parseFloat(scheme.nav).toFixed(2)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-gray-500">
          {scheme.date}
        </span>
      </td>
      <td className="px-6 py-4 text-center">
        <Link
          to={`/fund/${scheme.schemeCode}`}
          className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors"
        >
          View Details
          <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      to="/"
      className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 group"
    >
      <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      Back to AMCs
    </Link>
  );
}
