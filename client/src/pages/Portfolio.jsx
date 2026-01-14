import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { demoApi } from '../api';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { RectangleAd, BannerAd } from '../components/AdSense';

export default function Portfolio() {
  const { user, demoAccount, refreshBalance } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('holdings'); // 'holdings' or 'transactions'

  useEffect(() => {
    loadPortfolioData();
  }, []);

  const loadPortfolioData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [portfolioRes, transactionsRes] = await Promise.all([
        demoApi.getPortfolio(),
        demoApi.getTransactions({ limit: 20 })
      ]);

      if (portfolioRes.success) {
        setPortfolio(portfolioRes.data);
      }

      if (transactionsRes.success) {
        setTransactions(transactionsRes.data.transactions);
      }

      await refreshBalance();
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

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return <ErrorMessage message={error} onRetry={loadPortfolioData} />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          My Portfolio
        </h1>
        <p className="text-gray-600">Welcome back, {user?.fullName}</p>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-8 text-white">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-purple-100 text-sm mb-2">Available Balance</p>
            <p className="text-5xl font-bold mb-4">{formatCurrency(demoAccount?.balance || 0)}</p>
            <Link
              to="/invest"
              className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-semibold hover:bg-purple-50 transition-colors"
            >
              Invest Now
            </Link>
          </div>
          <div className="text-right">
            <p className="text-purple-100 text-sm mb-1">Total Invested</p>
            <p className="text-2xl font-bold">
              {formatCurrency(portfolio?.summary?.totalInvested || 0)}
            </p>
            <p className="text-purple-100 text-sm mt-3 mb-1">Current Value</p>
            <p className="text-2xl font-bold">
              {formatCurrency(portfolio?.summary?.totalCurrent || 0)}
            </p>
            <div className={`mt-2 text-lg font-semibold ${
              (portfolio?.summary?.totalReturns || 0) >= 0 ? 'text-green-300' : 'text-red-300'
            }`}>
              {(portfolio?.summary?.totalReturns || 0) >= 0 ? '+' : ''}
              {formatCurrency(portfolio?.summary?.totalReturns || 0)} 
              ({(portfolio?.summary?.returnsPercentage || 0).toFixed(2)}%)
            </div>
          </div>
        </div>
      </div>

      {/* Ad Section */}
      <div className="mb-8">
        <BannerAd />
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('holdings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'holdings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Holdings ({portfolio?.holdings?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Transactions ({transactions?.length || 0})
          </button>
        </div>
      </div>

      {/* Holdings Tab */}
      {activeTab === 'holdings' && (
        <div className="space-y-4">
          {portfolio?.holdings && portfolio.holdings.length > 0 ? (
            portfolio.holdings.map((holding) => (
              <div
                key={holding.id}
                className="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {holding.scheme_name}
                    </h3>
                    <p className="text-sm text-gray-500">Scheme Code: {holding.scheme_code}</p>
                  </div>
                  <div className={`text-right font-semibold ${
                    (holding.returns || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(holding.returns || 0) >= 0 ? '+' : ''}
                    {formatCurrency(holding.returns || 0)}
                    <div className="text-sm">
                      ({(holding.returns_percentage || 0).toFixed(2)}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Units</p>
                    <p className="font-semibold">{(holding.total_units || 0).toFixed(4)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Invested</p>
                    <p className="font-semibold">{formatCurrency(holding.invested_amount || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Value</p>
                    <p className="font-semibold">{formatCurrency(holding.current_value || 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Last NAV</p>
                    <p className="font-semibold">₹{(holding.last_nav || 0).toFixed(4)}</p>
                    {holding.last_nav_date && (
                      <p className="text-xs text-gray-500">{holding.last_nav_date}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <p className="text-gray-500 mb-4">No holdings yet</p>
              <Link
                to="/invest"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-colors"
              >
                Start Investing
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {transactions && transactions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      NAV
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {transactions.map((txn) => (
                    <tr key={txn.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(txn.executed_at)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        <div className="max-w-xs truncate" title={txn.scheme_name}>
                          {txn.scheme_name}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className="px-2 py-1 text-xs rounded-full bg-indigo-100 text-indigo-800">
                          {txn.transaction_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold">
                        {formatCurrency(txn.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        {(txn.units || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        ₹{(txn.nav || 0).toFixed(4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          txn.status === 'SUCCESS'
                            ? 'bg-green-100 text-green-800'
                            : txn.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {txn.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-500">No transactions yet</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
