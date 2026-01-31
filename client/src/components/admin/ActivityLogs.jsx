import { useState, useEffect } from 'react';
import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (envApiUrl && envApiUrl !== 'undefined') ? envApiUrl : '';


/**
 * ActivityLogs Component
 * Shows real-time activity feed with filtering
 */
export default function ActivityLogs() {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        fetchLogs();
    }, [filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('auth_token');
            const params = new URLSearchParams();
            if (filter) params.append('type', filter);
            params.append('limit', '30');

            const res = await axios.get(`${API_URL}/api/admin/activity-logs?${params}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLogs(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch activity logs:', err);
        } finally {
            setLoading(false);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'CRON':
                return (
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                        <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'SYNC':
                return (
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </div>
                );
            case 'TRANSACTION':
                return (
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-1.5 bg-gray-100 rounded-lg">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            SUCCESS: 'bg-emerald-100 text-emerald-700',
            FAILED: 'bg-red-100 text-red-700',
            RUNNING: 'bg-blue-100 text-blue-700',
            PENDING: 'bg-amber-100 text-amber-700',
            STARTED: 'bg-blue-100 text-blue-700',
            PARTIAL: 'bg-orange-100 text-orange-700'
        };
        return colors[status] || 'bg-gray-100 text-gray-700';
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-gray-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Activity Logs</h3>
                            <p className="text-sm text-gray-500">Recent system activity</p>
                        </div>
                    </div>

                    {/* Filter */}
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-transparent"
                    >
                        <option value="">All Types</option>
                        <option value="CRON">Cron Jobs</option>
                        <option value="SYNC">Fund Sync</option>
                        <option value="TRANSACTION">Transactions</option>
                    </select>
                </div>
            </div>

            {/* Logs List */}
            <div className="p-4">
                {loading ? (
                    <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="h-12 bg-gray-100 rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <p className="text-sm">No activity logs found</p>
                    </div>
                ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {logs.map((log, idx) => (
                            <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-gray-100 transition-colors"
                            >
                                {getTypeIcon(log.type)}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-900 text-sm truncate">{log.title}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded ${getStatusBadge(log.status)}`}>
                                            {log.status}
                                        </span>
                                    </div>
                                    {log.message && (
                                        <p className="text-xs text-gray-500 truncate mt-0.5">{log.message}</p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className="text-xs text-gray-400">{formatTime(log.timestamp)}</span>
                                    {log.duration_ms && (
                                        <p className="text-xs text-gray-400">{(log.duration_ms / 1000).toFixed(1)}s</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
