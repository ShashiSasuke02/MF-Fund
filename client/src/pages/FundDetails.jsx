import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fundApi } from '../api';
import { PageLoader } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { DisplayAd, RectangleAd } from '../components/AdSense';

/**
 * Fund Details page - shows detailed information about a specific fund
 */
export default function FundDetails() {
  const { schemeCode } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [fund, setFund] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchFundDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fundApi.getDetails(schemeCode);
      setFund(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundDetails();
  }, [schemeCode]);

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageLoader message="Loading fund details..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 group"
        >
          <svg className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>
        <ErrorMessage message={error} onRetry={fetchFundDetails} />
      </div>
    );
  }

  const meta = fund?.meta;
  const latestNav = fund?.latestNav;
  const navHistory = fund?.navHistory || [];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back Button with modern styling */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center text-sm font-semibold text-white hover:text-purple-200 mb-8 group transition-all duration-300"
      >
        <svg className="w-5 h-5 mr-2 group-hover:-translate-x-2 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
        </svg>
        Go Back
      </button>

      {/* Fund Header with modern card */}
      <div className="card mb-8 shadow-2xl">
        <div className="p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {meta?.scheme_name}
              </h1>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="badge-blue text-sm">{meta?.scheme_category}</span>
                <span className="badge-gray text-sm">{meta?.scheme_type}</span>
              </div>
              <p className="text-lg text-gray-600 font-medium">
                {meta?.fund_house}
              </p>
            </div>

            {/* Current NAV with gradient background */}
            <div className="bg-gradient-to-br from-purple-600 to-indigo-600 rounded-2xl p-6 text-center md:min-w-[200px] shadow-xl">
              <p className="text-sm text-purple-100 font-semibold mb-2 uppercase tracking-wider">Current NAV</p>
              <p className="text-4xl font-bold text-white mb-2">
                ₹{parseFloat(latestNav?.nav || 0).toFixed(2)}
              </p>
              <p className="text-xs text-purple-200 font-medium">
                {latestNav?.date || 'N/A'}
              </p>
              
              {/* Invest Button */}
              {isAuthenticated ? (
                <Link
                  to={`/invest?schemeCode=${schemeCode}`}
                  className="mt-4 block w-full px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Invest Now
                </Link>
              ) : (
                <Link
                  to="/register"
                  className="mt-4 block w-full px-4 py-2 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
                >
                  Register to Invest
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Fund Information Grid with modern cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Basic Info */}
        <div className="card shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Fund Information
            </h2>
            <dl className="space-y-4">
              <InfoRow label="Scheme Code" value={meta?.scheme_code} />
              <InfoRow label="Fund House" value={meta?.fund_house} />
              <InfoRow label="Category" value={meta?.scheme_category} />
              <InfoRow label="Type" value={meta?.scheme_type} />
            </dl>
          </div>
        </div>

        {/* ISIN Details */}
        <div className="card shadow-2xl">
          <div className="p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <svg className="w-6 h-6 mr-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
              </svg>
              ISIN Details
            </h2>
            <dl className="space-y-4">
              <InfoRow 
                label="ISIN (Growth)" 
                value={meta?.isin_growth || 'N/A'} 
                mono 
              />
              <InfoRow 
                label="ISIN (Div Reinvestment)" 
                value={meta?.isin_div_reinvestment || 'N/A'} 
                mono 
              />
            </dl>
          </div>
        </div>
      </div>

      {/* NAV History with modern styling */}
      <div className="card shadow-2xl">
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Recent NAV History
          </h2>
          
          {navHistory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No historical data available</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="pb-3 text-left text-sm font-medium text-gray-500">Date</th>
                    <th className="pb-3 text-right text-sm font-medium text-gray-500">NAV</th>
                    <th className="pb-3 text-right text-sm font-medium text-gray-500">Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {navHistory.map((item, index) => {
                    const prevNav = navHistory[index + 1]?.nav;
                    const change = prevNav ? ((parseFloat(item.nav) - parseFloat(prevNav)) / parseFloat(prevNav) * 100) : null;
                    
                    return (
                      <tr key={item.date}>
                        <td className="py-3 text-sm text-gray-900">{item.date}</td>
                        <td className="py-3 text-sm text-right font-medium text-gray-900">
                          ₹{parseFloat(item.nav).toFixed(4)}
                        </td>
                        <td className="py-3 text-sm text-right">
                          {change !== null ? (
                            <span className={`font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Ad Section */}
      <div className="mt-8">
        <DisplayAd />
      </div>
    </div>
  );
}

/**
 * Info row component for displaying label-value pairs
 */
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-medium text-gray-600">{label}</dt>
      <dd className={`text-sm font-semibold text-gray-900 ${mono ? 'font-mono text-xs bg-gray-100 px-3 py-1 rounded-lg' : ''}`}>
        {value || 'N/A'}
      </dd>
    </div>
  );
}
