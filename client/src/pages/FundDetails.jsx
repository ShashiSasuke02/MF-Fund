import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { fundApi } from '../api';
import { PageLoader } from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { useAuth } from '../contexts/AuthContext';
import { DisplayAd, RectangleAd, BannerAd } from '../components/AdSense';
import NavChart from '../components/NavChart';

/**
 * AMC Branding Configuration
 * 10 Whitelisted AMCs with logos, colors, and branding
 */
const AMC_BRANDING = {
  'SBI': {
    name: 'SBI Mutual Fund',
    shortName: 'SBI',
    primaryColor: '#1a4b9e',
    secondaryColor: '#2563eb',
    gradientFrom: 'from-blue-600',
    gradientTo: 'to-blue-800',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    logo: '/amc-logos/sbi.png',
    tagline: 'With you. For you. Always.',
  },
  'ICICI Prudential': {
    name: 'ICICI Prudential Mutual Fund',
    shortName: 'ICICI',
    primaryColor: '#b82e1c',
    secondaryColor: '#dc2626',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-orange-700',
    bgLight: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    logo: '/amc-logos/icici.png',
    tagline: 'Partner for Life',
  },
  'HDFC': {
    name: 'HDFC Mutual Fund',
    shortName: 'HDFC',
    primaryColor: '#004080',
    secondaryColor: '#004c99',
    gradientFrom: 'from-blue-800',
    gradientTo: 'to-blue-950',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-800',
    borderColor: 'border-blue-300',
    logo: '/amc-logos/hdfc.png',
    tagline: 'We understand your world',
  },
  'Nippon India': {
    name: 'Nippon India Mutual Fund',
    shortName: 'Nippon',
    primaryColor: '#cc0000',
    secondaryColor: '#e11d48',
    gradientFrom: 'from-rose-600',
    gradientTo: 'to-red-700',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    logo: '/amc-logos/nippon.png',
    tagline: 'Building Wealth. Creating Value.',
  },
  'Kotak Mahindra': {
    name: 'Kotak Mahindra Mutual Fund',
    shortName: 'Kotak',
    primaryColor: '#ed1c24',
    secondaryColor: '#dc2626',
    gradientFrom: 'from-red-600',
    gradientTo: 'to-red-800',
    bgLight: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    logo: '/amc-logos/kotak.png',
    tagline: 'Think Investments. Think Kotak.',
  },
  'Aditya Birla Sun Life': {
    name: 'Aditya Birla Sun Life Mutual Fund',
    shortName: 'ABSL',
    primaryColor: '#6b2c91',
    secondaryColor: '#7c3aed',
    gradientFrom: 'from-purple-600',
    gradientTo: 'to-violet-800',
    bgLight: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    logo: '/amc-logos/absl.png',
    tagline: 'Securing your present. Building your future.',
  },
  'UTI': {
    name: 'UTI Mutual Fund',
    shortName: 'UTI',
    primaryColor: '#0066b3',
    secondaryColor: '#0284c7',
    gradientFrom: 'from-sky-600',
    gradientTo: 'to-blue-700',
    bgLight: 'bg-sky-50',
    textColor: 'text-sky-700',
    borderColor: 'border-sky-200',
    logo: '/amc-logos/uti.png',
    tagline: 'Inspiring Trust. Building Tomorrow.',
  },
  'Axis': {
    name: 'Axis Mutual Fund',
    shortName: 'Axis',
    primaryColor: '#800020',
    secondaryColor: '#be123c',
    gradientFrom: 'from-rose-700',
    gradientTo: 'to-pink-800',
    bgLight: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    logo: '/amc-logos/axis.png',
    tagline: 'Badhti Ka Naam Zindagi',
  },
  'Tata': {
    name: 'Tata Mutual Fund',
    shortName: 'Tata',
    primaryColor: '#0033a0',
    secondaryColor: '#2563eb',
    gradientFrom: 'from-blue-700',
    gradientTo: 'to-indigo-800',
    bgLight: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    logo: '/amc-logos/tata.png',
    tagline: 'Improving the Quality of Life',
  },
  'Mirae Asset': {
    name: 'Mirae Asset Mutual Fund',
    shortName: 'Mirae',
    primaryColor: '#f7931e',
    secondaryColor: '#ea580c',
    gradientFrom: 'from-orange-500',
    gradientTo: 'to-amber-600',
    bgLight: 'bg-orange-50',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-200',
    logo: '/amc-logos/mirae.png',
    tagline: 'Global Investing. Local Expertise.',
  },
};

// Default branding for unknown AMCs
const DEFAULT_BRANDING = {
  name: 'Mutual Fund',
  shortName: 'MF',
  primaryColor: '#059669',
  secondaryColor: '#10b981',
  gradientFrom: 'from-emerald-500',
  gradientTo: 'to-teal-600',
  bgLight: 'bg-emerald-50',
  textColor: 'text-emerald-700',
  borderColor: 'border-emerald-200',
  logo: null,
  tagline: '',
};

/**
 * Get AMC branding based on fund house name
 */
function getAMCBranding(fundHouse) {
  if (!fundHouse) return DEFAULT_BRANDING;

  // Check each AMC key
  for (const [key, branding] of Object.entries(AMC_BRANDING)) {
    if (fundHouse.toLowerCase().includes(key.toLowerCase())) {
      return branding;
    }
  }

  return DEFAULT_BRANDING;
}

/**
 * AMC Logo Component with fallback to initials
 */
function AMCLogo({ branding, size = 'md' }) {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    sm: 'w-10 h-10 text-sm',
    md: 'w-14 h-14 text-lg',
    lg: 'w-20 h-20 text-2xl',
  };

  const getInitials = (name) => {
    return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  };

  if (branding.logo && !imageError) {
    return (
      <img
        src={branding.logo}
        alt={`${branding.name} logo`}
        className={`${sizeClasses[size]} object-contain rounded-xl`}
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback to styled initials
  return (
    <div
      className={`${sizeClasses[size]} rounded-xl flex items-center justify-center font-bold text-white shadow-lg`}
      style={{
        background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})`
      }}
    >
      {getInitials(branding.shortName)}
    </div>
  );
}

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

  // Get AMC branding based on fund house
  const amcBranding = getAMCBranding(meta?.fund_house);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden">
      {/* Animated decorative blobs with AMC color */}
      <div
        className="absolute top-0 left-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"
        style={{ backgroundColor: amcBranding.primaryColor }}
      />
      <div
        className="absolute top-0 right-0 w-96 h-96 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"
        style={{ backgroundColor: amcBranding.secondaryColor }}
      />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* Back Button with modern styling */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white/90 backdrop-blur-sm hover:bg-white border border-gray-300 hover:border-emerald-300 rounded-lg mb-6 group transition-all shadow-sm hover:shadow-md cursor-pointer"
        >
          <svg className="w-4 h-4 mr-2 text-emerald-600 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Go Back
        </button>

        {/* Banner Ad */}
        <div className="mb-6 bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <BannerAd />
        </div>

        {/* AMC Branded Header Card */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl border border-gray-200 mb-8 overflow-hidden">
          {/* AMC Brand Strip */}
          <div
            className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between"
            style={{
              background: `linear-gradient(135deg, ${amcBranding.primaryColor}, ${amcBranding.secondaryColor})`
            }}
          >
            <div className="flex items-center gap-3">
              <AMCLogo branding={amcBranding} size="sm" />
              <div>
                <p className="text-white font-bold text-sm sm:text-base">{amcBranding.name}</p>
                {amcBranding.tagline && (
                  <p className="text-white/80 text-xs hidden sm:block">{amcBranding.tagline}</p>
                )}
              </div>
            </div>

          </div>

          {/* Fund Details Content */}
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 sm:gap-6">
              <div className="flex-1">
                <div className={`inline-flex items-center px-4 py-2 ${amcBranding.bgLight} rounded-full shadow-sm ${amcBranding.borderColor} border mb-4`}>
                  <svg className={`w-4 h-4 ${amcBranding.textColor} mr-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className={`text-sm font-semibold ${amcBranding.textColor}`}>Mutual Fund Details</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
                  {meta?.scheme_name}
                </h1>
                <div className="flex flex-wrap gap-3 mb-4">
                  <span className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-semibold ${amcBranding.bgLight} ${amcBranding.textColor} ${amcBranding.borderColor} border`}>
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
                  <AMCLogo branding={amcBranding} size="md" />
                  <div className="ml-3">
                    <p className="text-lg font-semibold">{meta?.fund_house}</p>
                    {amcBranding.tagline && (
                      <p className="text-sm text-gray-500">{amcBranding.tagline}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Current NAV with AMC gradient */}
              <div
                className="rounded-2xl p-6 text-center lg:min-w-[240px] shadow-2xl relative overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${amcBranding.primaryColor}, ${amcBranding.secondaryColor})`
                }}
              >
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
                    {formatDate(latestNav?.date)}
                  </div>

                  {/* Invest Button */}
                  {isAuthenticated ? (
                    <Link
                      to={`/invest?schemeCode=${schemeCode}`}
                      className="mt-2 flex items-center justify-center w-full px-6 py-3 bg-white rounded-xl font-bold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 cursor-pointer"
                      style={{ color: amcBranding.primaryColor }}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                      Invest Now
                    </Link>
                  ) : (
                    <Link
                      to="/register"
                      className="mt-2 flex items-center justify-center w-full px-6 py-3 bg-white rounded-xl font-bold hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl transform hover:scale-105 cursor-pointer"
                      style={{ color: amcBranding.primaryColor }}
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

        {/* AMC Info Card */}
        <div className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl ${amcBranding.borderColor} border mb-8 overflow-hidden`}>
          <div
            className="px-6 py-4 border-b"
            style={{
              background: `linear-gradient(135deg, ${amcBranding.primaryColor}10, ${amcBranding.secondaryColor}10)`,
              borderColor: amcBranding.primaryColor + '20'
            }}
          >
            <div className="flex items-center gap-3">
              <AMCLogo branding={amcBranding} size="md" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">About {amcBranding.shortName}</h3>
                <p className="text-sm text-gray-600">{amcBranding.name}</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-xl ${amcBranding.bgLight} ${amcBranding.borderColor} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-5 h-5 ${amcBranding.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span className={`text-sm font-semibold ${amcBranding.textColor}`}>Trusted AMC</span>
                </div>
                <p className="text-xs text-gray-600">Trusted Fund House</p>
              </div>
              <div className={`p-4 rounded-xl ${amcBranding.bgLight} ${amcBranding.borderColor} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-5 h-5 ${amcBranding.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  <span className={`text-sm font-semibold ${amcBranding.textColor}`}>SEBI Registered</span>
                </div>
                <p className="text-xs text-gray-600">Regulated by SEBI</p>
              </div>
              <div className={`p-4 rounded-xl ${amcBranding.bgLight} ${amcBranding.borderColor} border`}>
                <div className="flex items-center gap-2 mb-2">
                  <svg className={`w-5 h-5 ${amcBranding.textColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className={`text-sm font-semibold ${amcBranding.textColor}`}>Daily NAV</span>
                </div>
                <p className="text-xs text-gray-600">Updated every trading day</p>
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
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${amcBranding.primaryColor}20, ${amcBranding.secondaryColor}20)`
                  }}
                >
                  <svg className="w-6 h-6" style={{ color: amcBranding.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Fund Information
                </h2>
              </div>
              <dl className="space-y-1">
                <InfoRow label="Scheme Code" value={meta?.scheme_code} branding={amcBranding} />
                <InfoRow label="Fund House" value={meta?.fund_house} branding={amcBranding} />
                <InfoRow label="Category" value={meta?.scheme_category} branding={amcBranding} />
                <InfoRow label="Type" value={meta?.scheme_type} branding={amcBranding} />
              </dl>
            </div>
          </div>

          {/* ISIN Details */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 hover:shadow-2xl hover:border-emerald-200 transition-all duration-300">
            <div className="p-6 sm:p-8">
              <div className="flex items-center mb-6">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md"
                  style={{
                    background: `linear-gradient(135deg, ${amcBranding.primaryColor}20, ${amcBranding.secondaryColor}20)`
                  }}
                >
                  <svg className="w-6 h-6" style={{ color: amcBranding.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  branding={amcBranding}
                />
                <InfoRow
                  label="ISIN (Div Reinvestment)"
                  value={meta?.isin_div_reinvestment || 'N/A'}
                  mono
                  branding={amcBranding}
                />
              </dl>
            </div>
          </div>
        </div>

        {/* NAV Chart */}
        {navHistory && navHistory.length > 0 && (
          <div className="mb-8">
            <NavChart navHistory={navHistory} branding={amcBranding} />
          </div>
        )}

        {/* Rectangle Ad before NAV History */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-md border border-gray-200 overflow-hidden">
            <RectangleAd />
          </div>
        </div>

        {/* NAV History with modern styling */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200">
          <div className="p-6 sm:p-8">
            <div className="flex items-center mb-6">
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mr-4 shadow-md"
                style={{
                  background: `linear-gradient(135deg, ${amcBranding.primaryColor}20, ${amcBranding.secondaryColor}20)`
                }}
              >
                <svg className="w-6 h-6" style={{ color: amcBranding.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div>
                {/* Desktop Table View */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full">
                    <thead
                      className="border-b-2"
                      style={{
                        background: `linear-gradient(to right, ${amcBranding.primaryColor}10, ${amcBranding.secondaryColor}10)`,
                        borderColor: amcBranding.primaryColor + '40'
                      }}
                    >
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Date</th>
                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">NAV</th>
                        <th className="px-4 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {navHistory.map((item, index) => {
                        const prevNav = navHistory[index + 1]?.nav;
                        const change = prevNav ? ((parseFloat(item.nav) - parseFloat(prevNav)) / parseFloat(prevNav) * 100) : null;
                        return (
                          <tr key={item.date} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-4 text-sm text-gray-900 font-medium">{formatDate(item.date)}</td>
                            <td className="px-4 py-4 text-right text-sm font-bold" style={{ color: amcBranding.primaryColor }}>
                              ₹{parseFloat(item.nav).toFixed(4)}
                            </td>
                            <td className="px-4 py-4 text-right">
                              {change !== null ? (
                                <span className={`inline-flex items-center px-3 py-1 rounded-lg font-bold text-xs ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                  {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                                </span>
                              ) : '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card View */}
                <div className="sm:hidden space-y-3">
                  {navHistory.map((item, index) => {
                    const prevNav = navHistory[index + 1]?.nav;
                    const change = prevNav ? ((parseFloat(item.nav) - parseFloat(prevNav)) / parseFloat(prevNav) * 100) : null;
                    return (
                      <div key={item.date} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
                        <div>
                          <p className="text-xs text-gray-500 font-medium">{formatDate(item.date)}</p>
                          <p className="text-sm font-bold" style={{ color: amcBranding.primaryColor }}>
                            ₹{parseFloat(item.nav).toFixed(4)}
                          </p>
                        </div>
                        <div>
                          {change !== null && (
                            <span className={`px-3 py-1 rounded-lg font-bold text-xs ${change >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
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
 * Format date string to readable format (DD MMM YYYY)
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
 * Info row component for displaying label-value pairs
 */
function InfoRow({ label, value, mono = false, branding = DEFAULT_BRANDING }) {
  return (
    <div className="flex justify-between items-center py-4 border-b border-gray-100 last:border-0 group hover:bg-gray-50/50 transition-colors px-2 -mx-2 rounded-lg">
      <dt className="text-sm font-semibold text-gray-600 flex items-center">
        <div
          className="w-2 h-2 rounded-full mr-3 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ backgroundColor: branding.primaryColor }}
        />
        {label}
      </dt>
      <dd className={`text-sm font-bold text-gray-900 ${mono
        ? 'font-mono text-xs bg-gradient-to-r from-gray-100 to-slate-100 px-3 py-1.5 rounded-lg border border-gray-200'
        : ''
        }`}>
        {value || 'N/A'}
      </dd>
    </div>
  );
}
