import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { amcApi } from '../api';
import { PageLoader, CardSkeleton } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header with gradient */}
      <div className="mb-12 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Top Asset Management Companies
        </h1>
        <p className="text-xl text-gray-100 max-w-2xl mx-auto">
          Discover and explore mutual fund schemes from India's leading AMCs
        </p>
      </div>

      {/* AMC Cards Grid with enhanced spacing */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {amcs.map((amc) => (
          <AmcCard key={amc.fundHouse} amc={amc} />
        ))}
      </div>
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
      'from-blue-500 to-blue-600',
      'from-green-500 to-emerald-600',
      'from-purple-500 to-indigo-600',
      'from-orange-500 to-amber-600',
      'from-pink-500 to-rose-600',
      'from-cyan-500 to-blue-600'
    ];
    const index = name.length % colors.length;
    return `bg-gradient-to-br ${colors[index]}`;
  };

  return (
    <Link
      to={`/amc/${encodeURIComponent(amc.fundHouse)}`}
      className="card-hover group relative overflow-hidden"
    >
      {/* Animated background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      <div className="p-8 relative z-10">
        {/* AMC Avatar and Name */}
        <div className="flex items-center space-x-5 mb-6">
          <div className={`w-16 h-16 ${getColorClass(amc.fundHouse)} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
            <span className="text-white font-bold text-xl">
              {getInitials(amc.displayName)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors duration-300 truncate">
              {amc.displayName}
            </h3>
          </div>
        </div>

        {/* Scheme Count */}
        <div className="flex items-center justify-between pt-6 border-t-2 border-gray-100">
          <div className="flex items-center text-gray-600">
            <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span className="text-base font-semibold">
              {amc.schemeCount !== null ? (
                <>{amc.schemeCount} <span className="text-gray-500 font-normal">schemes</span></>
              ) : (
                <span className="text-gray-400">Loading...</span>
              )}
            </span>
          </div>
          <div className="flex items-center text-purple-600 group-hover:translate-x-2 transition-all duration-300">
            <span className="text-sm font-bold mr-2">Explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </Link>
  );
}
