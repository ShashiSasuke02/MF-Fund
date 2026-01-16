import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/ingestion/sync/stats?days=30`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setStats(response.data.statistics);
      setError(null);
    } catch (err) {
      console.error('Error fetching stats:', err);
      
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.response?.data?.error || 'Failed to load statistics');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };

  const handleManualSync = async (syncType) => {
    if (!confirm(`Start ${syncType} sync? This may take several minutes.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('auth_token');
      const endpoint = syncType === 'full' ? '/sync/full' : '/sync/incremental';
      
      setRefreshing(true);
      const response = await axios.post(
        `${API_URL}/api/ingestion${endpoint}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        alert(`${syncType} sync completed successfully!`);
        fetchStats();
      } else {
        alert(`${syncType} sync failed: ${response.data.message}`);
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <ErrorMessage message={error} />
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700"
        >
          Go Home
        </button>
      </div>
    );
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const seconds = (ms / 1000).toFixed(2);
    return `${seconds}s`;
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">MFAPI Ingestion Performance & Statistics</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2"
          >
            <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Database Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Funds</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">
                  {stats?.database?.totalFunds?.toLocaleString() || 0}
                </p>
              </div>
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <p className="text-xs text-blue-600 mt-4">From 10 whitelisted AMCs</p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">NAV Records</p>
                <p className="text-3xl font-bold text-green-900 mt-2">
                  {stats?.database?.totalNavRecords?.toLocaleString() || 0}
                </p>
              </div>
              <svg className="w-12 h-12 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <p className="text-xs text-green-600 mt-4">
              Avg: {stats?.database?.averageNavRecordsPerFund || 0} per fund
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Syncs</p>
                <p className="text-3xl font-bold text-purple-900 mt-2">
                  {stats?.sync?.total_syncs || 0}
                </p>
              </div>
              <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <p className="text-xs text-purple-600 mt-4">Last 30 days</p>
          </div>
        </div>

        {/* Sync Performance */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Sync Performance (Last 30 Days)</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {stats?.sync?.total_syncs > 0 
                    ? ((stats.sync.successful_syncs / stats.sync.total_syncs) * 100).toFixed(1)
                    : 0}%
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {stats?.sync?.successful_syncs || 0} / {stats?.sync?.total_syncs || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Avg Duration</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {formatDuration(stats?.sync?.avg_duration_ms)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Max: {formatDuration(stats?.sync?.max_duration_ms)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total Funds Processed</p>
                <p className="text-2xl font-bold text-indigo-600 mt-1">
                  {stats?.sync?.total_funds_processed?.toLocaleString() || 0}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Total Errors</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {stats?.sync?.total_errors || 0}
                </p>
                {stats?.sync?.failed_syncs > 0 && (
                  <p className="text-xs text-red-500 mt-1">
                    {stats.sync.failed_syncs} failed syncs
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Last Successful Sync */}
        {stats?.lastSync && (
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Last Successful Sync</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-600">Sync Type</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {stats.lastSync.syncType}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Completed At</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {formatDate(stats.lastSync.completedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {stats.lastSync.duration}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Funds / NAV Records</p>
                  <p className="text-lg font-semibold text-gray-800 mt-1">
                    {stats.lastSync.fundsProcessed} / {stats.lastSync.navRecordsAdded}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Whitelisted AMCs */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Whitelisted AMCs (10)</h2>
            <p className="text-sm text-gray-600 mt-1">Funds from these AMCs are synced nightly</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {stats?.whitelistedAMCs?.map((amc, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium text-gray-800">{amc}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Sync Actions */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Manual Sync Triggers</h2>
            <p className="text-sm text-gray-600 mt-1">Trigger syncs manually for testing or immediate updates</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Full Sync</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Fetch all funds from 10 AMCs and update NAV data. Takes 5-10 minutes.
                </p>
                <button
                  onClick={() => handleManualSync('full')}
                  disabled={refreshing}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
                >
                  Start Full Sync
                </button>
              </div>

              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Incremental Sync</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Update NAV only for existing funds. Takes 2-3 minutes.
                </p>
                <button
                  onClick={() => handleManualSync('incremental')}
                  disabled={refreshing}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  Start Incremental Sync
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">Automated Syncs</p>
              <p className="text-sm text-blue-700 mt-1">
                Full sync runs daily at 2:00 AM IST. Enable in .env with ENABLE_FULL_SYNC=true.
                Incremental syncs (optional) can run at market hours (10 AM, 12 PM, 2 PM IST).
              </p>
            </div>
          </div>
        </div>
      </div>
  );
}
