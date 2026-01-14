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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden">
      {/* Animated decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
      {/* Back Button with modern styling */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 hover:border-emerald-300 rounded-lg mb-6 group transition-all shadow-sm hover:shadow-md"
      >
        <svg className="w-4 h-4 mr-2 text-emerald-600 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Go Back
      </button>

      {/* Fund Header with modern card */}
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 mb-8 overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div className="flex-1">
              <div className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full shadow-sm border border-emerald-200 mb-4">
                <svg className="w-4 h-4 text-emerald-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-semibold text-emerald-800">Mutual Fund Details</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {meta?.scheme_name}
              </h1>
              <div className="flex flex-wrap gap-3 mb-4">
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-800 border border-cyan-200">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  {meta?.scheme_category}
                </span>
                <span className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700 border border-gray-300">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {meta?.scheme_type}
                </span>
              </div>
              <div className="flex items-center text-gray-700">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-lg font-semibold">
                  {meta?.fund_house}
                </p>
              </div>
            </div>

            {/* Current NAV with gradient background */}
            <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 rounded-2xl p-6 text-center lg:min-w-[240px] shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE2YzAgNC40MTgtMy41ODIgOC04IDhzLTgtMy41ODItOC04IDMuNTgyLTggOC04IDggMy41ODIgOCA4eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-center mb-2">
                  <svg className="w-5 h-5 text-white/90 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  <p className="text-sm text-white/90 font-bold uppercase tracking-wider">Current NAV</p>
                </div>
                <p className="text-5xl font-bold text-white mb-2 flex items-start justify-center">
                  <span className="text-2xl mr-1 mt-2">₹</span>
                  {parseFloat(latestNav?.nav || 0).toFixed(2)}
                </p>
                <div className="flex items-center justify-center text-white/80 text-sm font-medium mb-4">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {latestNav?.date || 'N/A'}
                </div>
                
                {/* Invest Button */}
                {isAuthenticated ? (
                  <Link
                    to={`/invest?schemeCode=${schemeCode}`}
                    className="mt-2 flex items-center justify-center w-full px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Invest Now
                  </Link>
                ) : (
                  <Link
                    to="/register"
                    className="mt-2 flex items-center justify-center w-full px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Register to Invest
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fund Information Grid with modern cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Basic Info */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300">
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mr-4 shadow-md">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                Fund Information
              </h2>
            </div>
            <dl className="space-y-1">
              <InfoRow label="Scheme Code" value={meta?.scheme_code} />
              <InfoRow label="Fund House" value={meta?.fund_house} />
              <InfoRow label="Category" value={meta?.scheme_category} />
              <InfoRow label="Type" value={meta?.scheme_type} />
            </dl>
          </div>
        </div>

        {/* ISIN Details */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300">
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-100 to-cyan-100 rounded-xl flex items-center justify-center mr-4 shadow-md">
                <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900">
                ISIN Details
              </h2>
            </div>
            <dl className="space-y-1">
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
      <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
        <div className="p-6 sm:p-8">
          <div className="flex items-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-xl flex items-center justify-center mr-4 shadow-md">
              <svg className="w-6 h-6 text-cyan-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Recent NAV History
            </h2>
          </div>
          
          {navHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-gray-500 font-medium">No historical data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b-2 border-emerald-200">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <div className="flex items-center text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        Date
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        NAV
                      </div>
                    </th>
                    <th className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <svg className="w-4 h-4 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                        Change
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {navHistory.map((item, index) => {
                    const prevNav = navHistory[index + 1]?.nav;
                    const change = prevNav ? ((parseFloat(item.nav) - parseFloat(prevNav)) / parseFloat(prevNav) * 100) : null;
                    
                    return (
                      <tr key={item.date} className="hover:bg-emerald-50/50 transition-colors group">
                        <td className="px-4 py-4">
                          <div className="flex items-center text-sm text-gray-900 font-medium">
                            <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {item.date}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-lg">
                            <span className="text-sm font-bold text-emerald-900">
                              ₹{parseFloat(item.nav).toFixed(4)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {change !== null ? (
                            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg font-bold text-sm ${
                              change >= 0 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800' 
                                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800'
                            }`}>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                {change >= 0 ? (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                ) : (
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                )}
                              </svg>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">—</span>
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
    </div>
  );
}

/**
 * Info row component for displaying label-value pairs
 */
function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 group hover:bg-emerald-50/30 transition-colors px-2 -mx-2 rounded-lg">
      <dt className="text-sm font-semibold text-gray-600 flex items-center">
        <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {label}
      </dt>
      <dd className={`text-sm font-bold text-gray-900 ${
        mono 
          ? 'font-mono text-xs bg-gradient-to-r from-gray-100 to-slate-100 px-3 py-1.5 rounded-lg border border-gray-200' 
          : ''
      }`}>
        {value || 'N/A'}
      </dd>
    </div>
  );
}
