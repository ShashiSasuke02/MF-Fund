import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * SchedulerStats Component
 * Shows scheduler statistics including pending transactions, failures, and success rates
 */
export default function SchedulerStats() {
    const [stats, setStats] = useState(null);
    const [failures, setFailures] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const token = sessionStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };

            const [statsRes, failuresRes] = await Promise.all([
                axios.get(`${API_URL}/api/scheduler/statistics`, { headers }),
                axios.get(`${API_URL}/api/scheduler/failures?limit=5`, { headers })
            ]);

            setStats(statsRes.data.data);
            setFailures(failuresRes.data.data || []);
        } catch (err) {
            console.error('Failed to fetch scheduler stats:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="grid grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
                    ))}
                </div>
            </div>
        );
    }

    const successRate = stats?.totalExecutions > 0
        ? ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(1)
        : 0;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-xl">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Scheduler Activity</h3>
                        <p className="text-sm text-gray-500">SIP, SWP & STP Execution Stats</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="p-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Pending */}
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                        <p className="text-xs font-bold text-amber-600 uppercase tracking-wider">Pending</p>
                        <p className="text-3xl font-extrabold text-amber-700 mt-1">
                            {stats?.pendingTransactions || 0}
                        </p>
                        <p className="text-xs text-amber-500 mt-1">Awaiting execution</p>
                    </div>

                    {/* Today's Due */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider">Due Today</p>
                        <p className="text-3xl font-extrabold text-blue-700 mt-1">
                            {stats?.dueToday || 0}
                        </p>
                        <p className="text-xs text-blue-500 mt-1">Scheduled for today</p>
                    </div>

                    {/* Success Rate */}
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Success Rate</p>
                        <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                            {successRate}%
                        </p>
                        <div className="w-full bg-emerald-200 rounded-full h-1.5 mt-2">
                            <div
                                className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500"
                                style={{ width: `${successRate}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Failed */}
                    <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                        <p className="text-xs font-bold text-red-600 uppercase tracking-wider">Failed (7d)</p>
                        <p className="text-3xl font-extrabold text-red-700 mt-1">
                            {stats?.failedExecutions || 0}
                        </p>
                        <p className="text-xs text-red-500 mt-1">Last 7 days</p>
                    </div>
                </div>

                {/* Recent Failures */}
                {failures.length > 0 && (
                    <div className="mt-4">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Recent Failures
                        </h4>
                        <div className="space-y-2">
                            {failures.slice(0, 3).map((failure, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-red-50 rounded-lg px-4 py-2 border border-red-100">
                                    <div className="flex items-center gap-3">
                                        <span className="text-sm font-medium text-gray-800">{failure.scheme_name?.slice(0, 30)}...</span>
                                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">{failure.transaction_type}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">
                                        {new Date(failure.executed_at).toLocaleDateString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
