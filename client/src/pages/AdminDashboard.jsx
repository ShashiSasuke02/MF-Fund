import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import CronJobItem from '../components/CronJobItem';
import CronHistoryModal from '../components/CronHistoryModal';

// Admin Components
import SchedulerStats from '../components/admin/SchedulerStats';
import SyncActivityChart from '../components/admin/SyncActivityChart';
import UserManagement from '../components/admin/UserManagement';
import QuickActions from '../components/admin/QuickActions';
import ActivityLogs from '../components/admin/ActivityLogs';
import LogViewer from '../components/admin/LogViewer'; // [NEW]

const API_URL = import.meta.env.VITE_API_URL || '';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // History Modal State
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = sessionStorage.getItem('auth_token');
      if (!token) {
        navigate('/login');
        return;
      }

      // Fetch all dashboard data in parallel
      const [statsRes, jobsRes, dashRes] = await Promise.all([
        axios.get(`${API_URL}/api/ingestion/sync/stats?days=30`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/cron`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_URL}/api/admin/dashboard-stats`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: null } }))
      ]);

      setStats(statsRes.data.statistics);
      setJobs(jobsRes.data.jobs);
      setDashboardStats(dashRes.data.data);
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

  // Auto-refresh when any job is running
  useEffect(() => {
    const hasRunningJob = jobs.some(job => job.lastRun?.status === 'RUNNING');

    if (hasRunningJob) {
      const pollInterval = setInterval(() => {
        console.log('[Admin] Polling for job status updates...');
        fetchDashboardData();
      }, 3000);

      return () => clearInterval(pollInterval);
    }
  }, [jobs]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleRunJob = async (jobName) => {
    try {
      const token = sessionStorage.getItem('auth_token');
      const response = await axios.post(
        `${API_URL}/api/cron/trigger`,
        { jobName },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        fetchDashboardData();
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount || 0);
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'cron', label: 'Cron Jobs', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { id: 'users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { id: 'logs', label: 'Logs', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' }
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 mb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">System Monitoring & Management</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-emerald-200 transition-all active:scale-95"
        >
          <svg className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm whitespace-nowrap transition-all ${activeTab === tab.id
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <QuickActions onActionComplete={handleRefresh} />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {/* Total Users */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-violet-100 rounded-xl">
                  <svg className="w-5 h-5 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{dashboardStats?.users?.total || 0}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Total Users</p>
            </div>

            {/* Total Funds */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{dashboardStats?.funds?.total?.toLocaleString() || 0}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Total Funds</p>
            </div>

            {/* NAV Records */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{dashboardStats?.funds?.navRecords?.toLocaleString() || 0}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">NAV Records</p>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{dashboardStats?.transactions?.total || 0}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Transactions</p>
            </div>

            {/* Total Invested */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-teal-100 rounded-xl">
                  <svg className="w-5 h-5 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(dashboardStats?.holdings?.totalInvested)}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Total Invested</p>
            </div>

            {/* Current Value */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-pink-100 rounded-xl">
                  <svg className="w-5 h-5 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{formatCurrency(dashboardStats?.holdings?.totalCurrentValue)}</p>
              <p className="text-xs font-medium text-gray-500 mt-1">Current Value</p>
            </div>
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SchedulerStats />
            <SyncActivityChart />
          </div>
        </div>
      )}

      {/* Cron Jobs Tab */}
      {activeTab === 'cron' && (
        <div className="space-y-6">
          {/* Cron Job Management Section */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cron Job Monitoring</h2>
                <p className="text-sm text-gray-600 mt-1">Manage and trigger automated system tasks</p>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl border border-gray-200 text-sm font-bold text-gray-700 shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                {jobs.length} Jobs Registered
              </div>
            </div>
            <div className="p-6">
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

          {/* Ingestion Performance */}
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
              <h2 className="text-xl font-bold text-gray-900">Ingestion Performance</h2>
              <p className="text-sm text-gray-600 mt-1">Last 30 days statistics</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Success Rate</p>
                  <p className="text-3xl font-extrabold text-green-600 mt-2">
                    {stats?.sync?.total_syncs > 0
                      ? ((stats.sync.successful_syncs / stats.sync.total_syncs) * 100).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Avg Duration</p>
                  <p className="text-3xl font-extrabold text-blue-600 mt-2">
                    {stats?.sync?.avg_duration_ms ? (stats.sync.avg_duration_ms / 1000).toFixed(1) + 's' : 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Processed</p>
                  <p className="text-3xl font-extrabold text-indigo-600 mt-2">
                    {stats?.sync?.total_funds_processed?.toLocaleString() || 0}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                  <p className="text-xs font-bold text-gray-500 uppercase">Total Errors</p>
                  <p className="text-3xl font-extrabold text-red-600 mt-2">
                    {stats?.sync?.total_errors || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <UserManagement />
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="space-y-6">
          <LogViewer />
          <ActivityLogs />
        </div>
      )}

      {/* History Modal */}
      <CronHistoryModal
        jobName={selectedJob}
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
      />
    </div>
  );
}
