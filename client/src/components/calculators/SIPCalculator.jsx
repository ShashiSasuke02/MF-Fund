import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';
import { BannerAd, DisplayAd } from '../AdSense';

/**
 * SIP Calculator Component
 * Calculates Systematic Investment Plan returns
 */
export default function SIPCalculator({ interestRates }) {
  const [formData, setFormData] = useState({
    monthlyInvestment: '',
    expectedReturn: interestRates?.mutualFundEquity || 12,
    tenureYears: ''
  });
  
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await calculatorApi.calculateSIP(formData);
      setResult(response.data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      monthlyInvestment: '',
      expectedReturn: interestRates?.mutualFundEquity || 12,
      tenureYears: ''
    });
    setResult(null);
    setError(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Ad */}
      <BannerAd className="mb-6" />
      
      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r">
        <div className="flex">
          <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h3 className="text-sm font-semibold text-blue-900 mb-1">About SIP Calculator</h3>
            <p className="text-sm text-blue-800">
              A Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly in mutual funds. 
              This calculator helps you estimate the future value of your SIP investments based on expected returns.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCalculate} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Monthly Investment */}
          <div>
            <label htmlFor="monthlyInvestment" className="block text-sm font-semibold text-gray-700 mb-2">
              Monthly Investment (₹) *
            </label>
            <input
              type="number"
              id="monthlyInvestment"
              name="monthlyInvestment"
              value={formData.monthlyInvestment}
              onChange={handleInputChange}
              required
              min="500"
              step="any"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              placeholder="e.g., 5000"
            />
            <p className="text-xs text-gray-500 mt-1">Minimum ₹500</p>
          </div>

          {/* Expected Return */}
          <div>
            <label htmlFor="expectedReturn" className="block text-sm font-semibold text-gray-700 mb-2">
              Expected Return (% per annum) *
            </label>
            <input
              type="number"
              id="expectedReturn"
              name="expectedReturn"
              value={formData.expectedReturn}
              onChange={handleInputChange}
              required
              min="1"
              max="30"
              step="0.1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              placeholder="e.g., 12"
            />
            <p className="text-xs text-gray-500 mt-1">Typical equity MF: 10-15%</p>
          </div>

          {/* Tenure */}
          <div>
            <label htmlFor="tenureYears" className="block text-sm font-semibold text-gray-700 mb-2">
              Investment Tenure (years) *
            </label>
            <input
              type="number"
              id="tenureYears"
              name="tenureYears"
              value={formData.tenureYears}
              onChange={handleInputChange}
              required
              min="1"
              max="40"
              step="1"
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
              placeholder="e.g., 10"
            />
            <p className="text-xs text-gray-500 mt-1">Between 1 and 40 years</p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? <LoadingSpinner size="small" /> : (
              <>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Calculate Returns
              </>
            )}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="flex-1 sm:flex-initial bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-8 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border-2 border-emerald-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Calculation Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-600 mb-1">Total Investment</p>
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(result.totalInvestment)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-600 mb-1">Expected Returns</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(result.totalReturns)}</p>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-md">
              <p className="text-sm text-gray-600 mb-1">Maturity Amount</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.futureValue)}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-md">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Monthly SIP Amount:</p>
                <p className="font-semibold">{formatCurrency(result.monthlyInvestment)}</p>
              </div>
              <div>
                <p className="text-gray-600">Expected Return Rate:</p>
                <p className="font-semibold">{result.expectedReturn}% p.a.</p>
              </div>
              <div>
                <p className="text-gray-600">Total Months:</p>
                <p className="font-semibold">{result.totalMonths} months</p>
              </div>
              <div>
                <p className="text-gray-600">Return on Investment:</p>
                <p className="font-semibold text-green-600">
                  {((result.totalReturns / result.totalInvestment) * 100).toFixed(2)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Display Ad */}
      {result && <DisplayAd className="mt-8" />}
    </div>
  );
}
