import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { demoApi, fundApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';

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

  const loadFundDetails = async () => {
    try {
      setError('');
      const response = await fundApi.getDetails(schemeCode);
      if (response && response.data) {
        setFundDetails(response.data);
      }
    } catch (err) {
      setError('Failed to load fund details: ' + err.message);
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
        await refreshBalance();
        
        // Redirect to portfolio after 2 seconds
        setTimeout(() => {
          navigate('/portfolio');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
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
        <div className="max-w-md mx-auto bg-green-50 border border-green-200 rounded-xl p-8 text-center">
          <div className="text-green-600 text-6xl mb-4">✓</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Transaction Successful!</h2>
          <p className="text-gray-600 mb-4">
            Your {transactionType.replace('_', ' ')} investment has been processed.
          </p>
          <p className="text-sm text-gray-500">Redirecting to portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Invest</h1>
        <p className="text-gray-600 mb-8">
          Available Balance: <span className="font-semibold text-indigo-600">
            {formatCurrency(demoAccount?.balance || 0)}
          </span>
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Scheme Code */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label htmlFor="schemeCode" className="block text-sm font-medium text-gray-700 mb-2">
              Scheme Code *
            </label>
            <div className="flex gap-2">
              <input
                id="schemeCode"
                type="number"
                value={schemeCode}
                onChange={(e) => setSchemeCode(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter scheme code"
                required
              />
              <button
                type="button"
                onClick={loadFundDetails}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Load
              </button>
            </div>
            
            {fundDetails && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p className="font-semibold text-gray-900">{fundDetails.meta?.scheme_name}</p>
                <p className="text-sm text-gray-600 mt-1">{fundDetails.meta?.fund_house}</p>
                <p className="text-sm text-indigo-600 mt-2">
                  Latest NAV: ₹{fundDetails.latestNav?.nav || 'N/A'}
                </p>
              </div>
            )}
          </div>

          {/* Transaction Type */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Transaction Type *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {['LUMP_SUM', 'SIP', 'STP', 'SWP'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setTransactionType(type)}
                  className={`px-4 py-3 rounded-lg font-medium text-sm transition-colors ${
                    transactionType === type
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Amount */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Amount *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={handleChange}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter amount"
                required
              />
            </div>
          </div>

          {/* Frequency and dates for SIP/STP/SWP */}
          {transactionType !== 'LUMP_SUM' && (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency *
                </label>
                <select
                  id="frequency"
                  name="frequency"
                  value={formData.frequency}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                >
                  <option value="MONTHLY">Monthly</option>
                  <option value="QUARTERLY">Quarterly</option>
                  <option value="WEEKLY">Weekly</option>
                </select>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date (Optional)
                  </label>
                  <input
                    id="endDate"
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6">
                <label htmlFor="installments" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Installments (Optional)
                </label>
                <input
                  id="installments"
                  name="installments"
                  type="number"
                  value={formData.installments}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Leave empty for indefinite"
                />
              </div>
            </>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/portfolio')}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Invest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
