import { useState } from 'react';
import { calculatorApi } from '../../api';
import LoadingSpinner from '../LoadingSpinner';

export default function LoanBasicCalculator({ interestRates }) {
  const [formData, setFormData] = useState({
    principal: '',
    rate: '',
    tenureMonths: ''
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
      const data = await calculatorApi.calculateBasicLoanEMI({
        principal: parseFloat(formData.principal),
        rate: parseFloat(formData.rate),
        tenureMonths: parseInt(formData.tenureMonths)
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Failed to calculate loan EMI');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({
      principal: '',
      rate: '',
      tenureMonths: ''
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
          <strong>Loan EMI Calculator (Basic):</strong> Calculate your monthly EMI (Equated Monthly Installment) 
          for home loans, car loans, personal loans, and more. The EMI depends on the loan amount, 
          interest rate, and tenure. Formula: EMI = [P × R × (1+R)^N] / [(1+R)^N-1]
        </p>
      </div>

      {/* Calculator Form */}
      <form onSubmit={handleCalculate} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Loan EMI Calculator</h2>

        <div>
          <label htmlFor="principal" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Amount (₹)
          </label>
          <input
            type="number"
            id="principal"
            name="principal"
            value={formData.principal}
            onChange={handleInputChange}
            min="1000"
            step="1000"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 1000000"
          />
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
            max="30"
            step="0.1"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 8.5"
          />
        </div>

        <div>
          <label htmlFor="tenureMonths" className="block text-sm font-medium text-gray-700 mb-2">
            Loan Tenure (months)
          </label>
          <input
            type="number"
            id="tenureMonths"
            name="tenureMonths"
            value={formData.tenureMonths}
            onChange={handleInputChange}
            min="1"
            max="360"
            required
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="e.g., 240 (20 years)"
          />
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
            {loading ? 'Calculating...' : 'Calculate EMI'}
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
          <h3 className="text-xl font-bold text-gray-800 mb-4">EMI Breakdown</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-lg p-4 border border-emerald-200">
              <p className="text-sm text-gray-600 mb-1">Monthly EMI</p>
              <p className="text-2xl font-bold text-emerald-600">{formatCurrency(result.emi)}</p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
              <p className="text-sm text-gray-600 mb-1">Total Interest</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(result.totalInterest)}</p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
              <p className="text-sm text-gray-600 mb-1">Total Payment</p>
              <p className="text-2xl font-bold text-purple-600">{formatCurrency(result.totalAmount)}</p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mt-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Loan Amount:</p>
                <p className="font-semibold text-gray-800">{formatCurrency(result.principal)}</p>
              </div>
              <div>
                <p className="text-gray-600">Loan Tenure:</p>
                <p className="font-semibold text-gray-800">{result.tenureMonths} months ({Math.round(result.tenureMonths/12)} years)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
