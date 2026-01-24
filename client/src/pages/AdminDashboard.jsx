import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CronJobItem from '../components/CronJobItem';
import CronHistoryModal from '../components/CronHistoryModal';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch both stats and cron jobs in parallel
      const [statsRes, jobsRes] = await Promise.all([
        axios.get(`${API_URL}/api/ingestion/sync/stats?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/cron`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setStats(statsRes.data.statistics);
      setJobs(jobsRes.data.jobs);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);

      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError(err.response?.data?.error || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleRunJob = async (jobName) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/api/cron/trigger`,
        { jobName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        // Show success, maybe a toast in a real app
        fetchDashboardData(); // Refresh to show "RUNNING" or updated last run
      } else {
        alert(`Failed to trigger ${jobName}: ${response.data.error}`);
      }
    } catch (err) {
      alert(`Error: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleShowHistory = (jobName) => {
    setSelectedJob(jobName);
    setHistoryModalOpen(true);
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
    <div className="max-w-7xl mx-auto p-4 sm:p-6 mb-20">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">System Monitoring & Cron Management</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-md transition-all active:scale-95"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Database Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Funds Card */}
        <div className="bg-white border border-blue-100 rounded-2xl shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider">Total Funds</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">
                {stats?.database?.totalFunds?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mt-6 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            From 10 whitelisted AMCs
          </p>
        </div>

        {/* NAV Records Card */}
        <div className="bg-white border border-emerald-100 rounded-2xl shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-emerald-600 uppercase tracking-wider">NAV Records</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">
                {stats?.database?.totalNavRecords?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-emerald-600 rounded-xl shadow-lg shadow-emerald-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mt-6 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Avg: {stats?.database?.averageNavRecordsPerFund || 0} per fund
          </p>
        </div>

        {/* Syncs Card */}
        <div className="bg-white border border-purple-100 rounded-2xl shadow-sm p-6 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-500"></div>
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-purple-600 uppercase tracking-wider">Total Syncs</p>
              <p className="text-4xl font-extrabold text-gray-900 mt-2">
                {stats?.sync?.total_syncs || 0}
              </p>
            </div>
            <div className="p-3 bg-purple-600 rounded-xl shadow-lg shadow-purple-200">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
          </div>
          <p className="text-xs font-medium text-gray-500 mt-6 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Last 30 days
          </p>
        </div>
      </div>

      {/* Cron Job Management Section */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm mb-8 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Cron Job Monitoring</h2>
            <p className="text-sm text-gray-600 mt-1">Manage and trigger automated system tasks</p>
          </div>
          <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {jobs.length} Jobs Registered
          </div>
        </div>
        <div className="p-8">
          <div className="flex flex-col gap-4">
            {jobs.map(job => (
              <CronJobItem
                key={job.name}
                job={job}
                onRun={handleRunJob}
                onShowHistory={handleShowHistory}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Sync Performance Grid */}
      <div className="bg-white border border-gray-200 rounded-3xl shadow-sm mb-8 overflow-hidden">
        <div className="p-8 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-black text-gray-900 tracking-tight">Ingestion Performance</h2>
        </div>
        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Success Rate</p>
              <p className="text-3xl font-extrabold text-green-600 mt-2">
                {stats?.sync?.total_syncs > 0
                  ? ((stats.sync.successful_syncs / stats.sync.total_syncs) * 100).toFixed(1)
                  : 0}%
              </p>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-4">
                <div
                  className="bg-green-500 h-1.5 rounded-full"
                  style={{ width: `${stats?.sync?.total_syncs > 0 ? (stats.sync.successful_syncs / stats.sync.total_syncs) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Avg Duration</p>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">
                {formatDuration(stats?.sync?.avg_duration_ms)}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-4">
                Peak: {formatDuration(stats?.sync?.max_duration_ms)}
              </p>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Processed</p>
              <p className="text-3xl font-extrabold text-indigo-600 mt-2">
                {stats?.sync?.total_funds_processed?.toLocaleString() || 0}
              </p>
              <p className="text-xs font-medium text-gray-400 mt-4">Funds Processed</p>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Errors</p>
              <p className="text-3xl font-extrabold text-red-600 mt-2">
                {stats?.sync?.total_errors || 0}
              </p>
              <p className="text-xs font-medium text-red-400 mt-4 flex items-center gap-1">
                {stats?.sync?.failed_syncs || 0} Failed Sessions
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info Callout */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-blue-200">
        <div className="flex items-start gap-5">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0116 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold">Automated Sync Configuration</h3>
            <p className="text-blue-100 mt-2 leading-relaxed max-w-3xl">
              The system runs a <strong>Full Sync</strong> daily at 2:00 AM IST.
              Incremental updates occur during market hours (10 AM, 12 PM, 2 PM IST).
              Ensure <code>ENABLE_FULL_SYNC</code> and <code>ENABLE_INCREMENTAL_SYNC</code> are set in your environment file.
            </p>
          </div>
        </div>
      </div>

      {/* History Modal */}
      <CronHistoryModal
        jobName={selectedJob}
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
}
