import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { demoApi, fundApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import { DisplayAd, RectangleAd } from '../components/AdSense';

export default function Invest() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { demoAccount, refreshBalance } = useAuth();

  const [schemeCode, setSchemeCode] = useState(searchParams.get('schemeCode') || '');
  const [fundDetails, setFundDetails] = useState(null);
  const [transactionType, setTransactionType] = useState('LUMP_SUM');
  const [formData, setFormData] = useState({
    amount: '',
    frequency: 'MONTHLY',
    startDate: '',
    endDate: '',
    installments: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (schemeCode) {
      loadFundDetails();
    }
  }, [schemeCode]);

  // Handle navigation after successful transaction
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        navigate('/portfolio');
      }, 2000);

      // Cleanup timeout on unmount
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  const loadFundDetails = async () => {
    if (!schemeCode) {
      navigate('/browse');
      return;
    }

    try {
      setError('');
      setLoading(true); // Optional: Add loading state interaction
      const response = await fundApi.getDetails(schemeCode);
      if (response && response.data) {
        setFundDetails(response.data);
      }
    } catch (err) {
      setError('Failed to load fund details: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!schemeCode) {
      setError('Please enter a scheme code');
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (parseFloat(formData.amount) > demoAccount?.balance) {
      setError('Insufficient balance');
      return;
    }

    if (transactionType !== 'LUMP_SUM') {
      if (!formData.frequency) {
        setError('Please select a frequency');
        return;
      }
      if (!formData.startDate) {
        setError('Please select a start date');
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const transactionData = {
        schemeCode: parseInt(schemeCode),
        transactionType,
        amount: parseFloat(formData.amount),
        frequency: transactionType === 'LUMP_SUM' ? undefined : formData.frequency,
        startDate: transactionType === 'LUMP_SUM' ? undefined : formData.startDate,
        endDate: transactionType === 'LUMP_SUM' ? undefined : formData.endDate || undefined,
        installments: transactionType === 'LUMP_SUM' || !formData.installments
          ? undefined
          : parseInt(formData.installments)
      };

      const response = await demoApi.createTransaction(transactionData);

      if (response.success) {
        setSuccess(true);

        // Refresh balance in the background (don't block navigation if it fails)
        refreshBalance().catch(err => {
          console.error('[Invest] Failed to refresh balance:', err);
        });
      } else {
        setError(response.error || 'Transaction failed');
      }
    } catch (err) {
      console.error('[Invest] Transaction error:', err);
      setError(err.message || 'Transaction failed');
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

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto relative">
          {/* Decorative blobs */}
          <div className="absolute -top-4 -left-4 w-72 h-72 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-72 h-72 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-50 animate-blob animation-delay-2000"></div>

          <div className="relative bg-white/90 backdrop-blur-sm border-2 border-emerald-200 rounded-2xl p-8 text-center shadow-2xl">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-full mb-6">
              <svg className="w-12 h-12 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Transaction Successful!</h2>
            <p className="text-gray-600 mb-2 text-lg">
              Your <span className="font-semibold text-emerald-600">{transactionType.replace('_', ' ')}</span> investment has been processed.
            </p>
            <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-sm text-emerald-800 flex items-center justify-center">
                <svg className="w-5 h-5 mr-2 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Redirecting to portfolio...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Top Rectangle Ad */}
        <div className="mb-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
          <RectangleAd />
        </div>

        {/* Header with decorative elements */}
        <div className="relative mb-8">
          <div className="absolute -top-4 -left-4 w-64 h-64 bg-emerald-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute -top-4 -right-4 w-64 h-64 bg-teal-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>

          <div className="relative">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Start Investing</h1>
                <p className="text-gray-600 mt-1">Build your portfolio with confidence</p>
              </div>
            </div>

            {/* Balance Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl p-6 shadow-xl border border-emerald-400">
              <div className="flex items-center justify-between text-white">
                <div>
                  <div className="flex items-center mb-2">
                    <svg className="w-5 h-5 mr-2 text-white/90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    <span className="text-sm font-medium text-white/90">Available Balance</span>
                  </div>
                  <p className="text-3xl font-bold tracking-tight">
                    {formatCurrency(demoAccount?.balance || 0)}
                  </p>
                </div>
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg flex items-start shadow-lg">
              <svg className="w-6 h-6 text-red-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Scheme Code */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
            <label htmlFor="schemeCode" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Scheme Code *
            </label>
            <div className="flex gap-3">
              <input
                id="schemeCode"
                type="number"
                value={schemeCode}
                onChange={(e) => setSchemeCode(e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                placeholder="Enter scheme code (e.g., 119551)"
                required
              />
              <button
                type="button"
                onClick={loadFundDetails}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl hover:from-emerald-600 hover:to-teal-700 font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Load
              </button>
            </div>

            {fundDetails && (
              <div className="mt-4 p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200 shadow-inner">
                <div className="flex items-start">
                  <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-emerald-100 to-teal-100 rounded-xl flex items-center justify-center mr-4">
                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-lg">{fundDetails.meta?.scheme_name}</p>
                    <p className="text-sm text-gray-600 mt-1 flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      {fundDetails.meta?.fund_house}
                    </p>
                    <div className="mt-3 inline-flex items-center px-4 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-semibold">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      Latest NAV: ₹{fundDetails.latestNav?.nav || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
            <label className="flex items-center text-sm font-semibold text-gray-700 mb-4">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['LUMP_SUM', 'SIP', 'SWP'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  className={`px-4 py-4 rounded-xl font-semibold text-sm transition-all transform hover:scale-105 ${transactionType === type
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                    }`}
                >
                  <div className="flex flex-col items-center">
                    <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {type === 'LUMP_SUM' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      )}
                      {type === 'SIP' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      )}

                      {type === 'SWP' && (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      )}
                    </svg>
                    {type.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
            <label htmlFor="amount" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
              <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              {transactionType === 'SWP' ? 'Withdrawal Amount *' : 'Investment Amount *'}
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 font-semibold text-lg">₹</span>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-10 pr-4 py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-lg font-semibold"
                placeholder={transactionType === 'SWP' ? "Enter withdrawal amount" : "Enter investment amount"}
                required
              />
            </div>
            <p className="mt-2 text-sm text-gray-500 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Minimum investment amount varies by scheme
            </p>
          </div>

          {/* Frequency and dates for SIP/STP/SWP */}
          {transactionType !== 'LUMP_SUM' && (
            <>
              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
                <label htmlFor="frequency" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Payment Frequency *
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all appearance-none bg-white"
                  required
                >
                  {transactionType !== 'SWP' && (
                    <>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </>
                  )}
                  <option value="MONTHLY">Monthly (Recommended)</option>
                  <option value="QUARTERLY">Quarterly</option>
                </select>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Start Date *
                    </label>
                    <input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                      <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      End Date (Optional)
                    </label>
                    <input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6 transition-all hover:shadow-xl">
                <label htmlFor="installments" className="flex items-center text-sm font-semibold text-gray-700 mb-3">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Number of Installments (Optional)
                </label>
                <input
                  id="installments"
                  name="installments"
                  type="number"
                  value={formData.installments}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                  placeholder="Leave empty for indefinite (e.g., 12, 24, 36)"
                />
                <p className="mt-2 text-sm text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Leave empty to continue until manually stopped
                </p>
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="flex-1 px-6 py-4 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-semibold transition-all flex items-center justify-center hover:border-gray-400 min-h-[56px]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none flex items-center justify-center min-h-[56px]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Invest Now
                </>
              )}
            </button>
          </div>

          {/* Info Card - Removed per user request */}

        </form>

        {/* Bottom Display Ad */}
        <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl shadow-lg p-4 border border-gray-200">
          <DisplayAd />
        </div>
      </div>
    </div>
  );
}
