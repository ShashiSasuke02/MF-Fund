import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

export default function PPFCalculator({ interestRates }) {
  const [formData, setFormData] = useState({
    annualDeposit: '',
    rate: interestRates?.ppf || '7.1',
    depositYears: '15'
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(null);
  };

  const handleCalculate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const data = await calculatorApi.calculatePPF({
        annualDeposit: parseFloat(formData.annualDeposit),
        rate: parseFloat(formData.rate),
        depositYears: parseInt(formData.depositYears)
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate PPF returns');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      annualDeposit: '',
      rate: interestRates?.ppf || '7.1',
      depositYears: '15'
    });
    setResult(null);
    setError(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Info Box */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Public Provident Fund (PPF):</strong> A long-term investment option with tax benefits under Section 80C. 
          PPF has a 15-year lock-in period with annual compounding. Minimum deposit: ₹500, Maximum: ₹1.5 lakhs per year. 
          Current interest rate: {interestRates?.ppf || '7.1'}% per annum.
        </p>
      </div>

      {/* Calculator Form */}
      <form onSubmit={handleCalculate} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">PPF Calculator</h2>

        <div>
          <label htmlFor="annualDeposit" className="block text-sm font-medium text-gray-700 mb-2">
            Annual Deposit (₹)
          </label>
          <input
            type="number"
            id="annualDeposit"
            name="annualDeposit"
            value={formData.annualDeposit}
            onChange={handleInputChange}
            min="500"
            max="150000"
            step="500"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 150000"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum: ₹500, Maximum: ₹1,50,000</p>
        </div>

        <div>
          <label htmlFor="rate" className="block text-sm font-medium text-gray-700 mb-2">
            Interest Rate (% per annum)
          </label>
          <input
            type="number"
            id="rate"
            name="rate"
            value={formData.rate}
            onChange={handleInputChange}
            min="1"
            max="15"
            step="0.1"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 7.1"
          />
        </div>

        <div>
          <label htmlFor="depositYears" className="block text-sm font-medium text-gray-700 mb-2">
            Deposit Period (years)
          </label>
          <input
            type="number"
            id="depositYears"
            name="depositYears"
            value={formData.depositYears}
            onChange={handleInputChange}
            min="15"
            max="50"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 15"
          />
          <p className="text-xs text-gray-500 mt-1">Minimum lock-in: 15 years (extendable in 5-year blocks)</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate Returns'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Loading Spinner */}
      {loading && (
        <div className="flex justify-center py-8">
          <LoadingSpinner />
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 animate-fade-in">
          <h3 className="text-xl font-bold text-gray-800 mb-4">PPF Maturity Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Deposits</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalDeposit)}</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Total Interest</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.totalInterest)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Maturity Amount</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(result.maturityAmount)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Annual Deposit:</p>
                <p className="font-semibold text-gray-800">{formatCurrency(result.annualDeposit)}</p>
              </div>
              <div>
                <p className="text-gray-600">Investment Period:</p>
                <p className="font-semibold text-gray-800">{formData.depositYears} years</p>
              </div>
              <div>
                <p className="text-gray-600">Interest Rate:</p>
                <p className="font-semibold text-gray-800">{formData.rate}% p.a.</p>
              </div>
              <div>
                <p className="text-gray-600">Returns Multiplier:</p>
                <p className="font-semibold text-emerald-600">{(result.maturityAmount / result.totalDeposit).toFixed(2)}x</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-gray-700">
              <strong>💡 Tax Benefits:</strong> PPF deposits qualify for deduction under Section 80C (up to ₹1.5 lakhs). 
              Interest earned and maturity amount are completely tax-free (EEE status).
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
