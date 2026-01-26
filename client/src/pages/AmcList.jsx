import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { amcApi } from '../api';
import { PageLoader, CardSkeleton } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { BannerAd, DisplayAd } from '../components/AdSense';
import MarketMasteryBanner from '../components/MarketMasteryBanner';

/**
 * AMC List page - displays top AMCs as cards
 */
export default function AmcList() {
  const [amcs, setAmcs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAmcs = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await amcApi.getAll();
      setAmcs(response.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAmcs();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="skeleton h-8 w-64 mb-2" />
          <div className="skeleton h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ErrorMessage message={error} onRetry={fetchAmcs} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden pb-16">
      {/* Animated decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Top Banner Ad */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
          <BannerAd />
        </div>

        {/* Header with gradient */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center px-5 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-emerald-200 mb-6">
            <svg className="w-5 h-5 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-sm font-semibold text-emerald-700">India's Leading Fund Houses</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-gray-900 via-emerald-900 to-teal-900 bg-clip-text text-transparent">
            Top Asset Management Companies
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Discover and explore mutual fund schemes from India's leading AMCs
          </p>
        </div>

        {/* AMC Cards Grid with enhanced spacing */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {amcs.map((amc) => (
            <AmcCard key={amc.fundHouse} amc={amc} />
          ))}
        </div>

        {/* Bottom Display Ad */}
        <div className="mt-12 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-6 border border-gray-200">
          <DisplayAd />
        </div>
      </div>
      <MarketMasteryBanner />
    </div>
  );
}

/**
 * Individual AMC card component
 */
function AmcCard({ amc }) {
  // Get initials for avatar
  const getInitials = (name) => {
    return name
      .split(' ')
      .slice(0, 2)
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  // Get background color based on name
  const getColorClass = (name) => {
    const colors = [
      'from-emerald-500 to-teal-600',
      'from-teal-500 to-cyan-600',
      'from-cyan-500 to-blue-600',
      'from-blue-500 to-indigo-600',
      'from-purple-500 to-pink-600',
      'from-pink-500 to-rose-600',
      'from-orange-500 to-amber-600',
      'from-amber-500 to-yellow-600'
    ];
    const index = name.length % colors.length;
    return `bg-gradient-to-br ${colors[index]}`;
  };

  return (
    <Link
      to={`/amc/${encodeURIComponent(amc.fundHouse)}`}
      className="group relative block"
    >
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-emerald-300 hover:scale-[1.02] transform">
        {/* Animated background gradient on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-teal-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="p-6 sm:p-8 relative z-10">
          {/* AMC Avatar and Name */}
          <div className="flex items-center space-x-4 mb-6">
            <div className={`w-16 h-16 sm:w-20 sm:h-20 ${getColorClass(amc.fundHouse)} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
              <span className="text-white font-bold text-xl sm:text-2xl">
                {getInitials(amc.displayName)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 group-hover:text-emerald-700 transition-colors duration-300 line-clamp-2">
                {amc.displayName}
              </h3>
            </div>
          </div>

          {/* Scheme Count */}
          <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100 group-hover:border-emerald-200 transition-colors duration-300">
            <div className="flex items-center text-gray-600">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-3 shadow-sm">
                <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <span className="text-base font-semibold">
                {amc.schemeCount !== null ? (
                  <><span className="text-gray-900">{amc.schemeCount}</span> <span className="text-gray-500 font-normal">schemes</span></>
                ) : (
                  <span className="text-gray-400">Loading...</span>
                )}
              </span>
            </div>
            <div className="flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg shadow-lg group-hover:shadow-xl group-hover:from-emerald-600 group-hover:to-teal-700 transition-all duration-300 group-hover:translate-x-1 transform">
              <span className="text-sm font-bold mr-2">Explore</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
