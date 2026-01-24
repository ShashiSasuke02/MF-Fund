import { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * SyncActivityChart Component
 * Shows a 7-day bar chart of sync activity (Full vs Incremental)
 */
export default function SyncActivityChart() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChartData();
    }, []);

    const fetchChartData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const res = await axios.get(`${API_URL}/api/admin/sync-chart-data?days=7`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setChartData(res.data.data || []);
        } catch (err) {
            console.error('Failed to fetch sync chart data:', err);
        } finally {
            setLoading(false);
        }
    };

    // Calculate max value for scaling
    const maxValue = Math.max(
        ...chartData.map(d => Math.max(d.fullSync || 0, d.incrementalSync || 0)),
        1
    );

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                <div className="h-48 bg-gray-100 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-xl">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Sync Activity</h3>
                            <p className="text-sm text-gray-500">Last 7 days</p>
                        </div>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-blue-500"></span>
                            <span className="text-gray-600">Full Sync</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded bg-emerald-500"></span>
                            <span className="text-gray-600">Incremental</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="p-6">
                {chartData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-gray-400">
                        <div className="text-center">
                            <svg className="w-12 h-12 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm">No sync data available</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-end justify-between h-48 gap-2">
                        {chartData.map((day, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                                {/* Bars */}
                                <div className="flex items-end gap-1 h-36 w-full justify-center">
                                    {/* Full Sync Bar */}
                                    <div
                                        className="w-5 bg-blue-500 rounded-t transition-all duration-500 hover:bg-blue-600 cursor-pointer relative group"
                                        style={{ height: `${(day.fullSync / maxValue) * 100}%`, minHeight: day.fullSync > 0 ? '8px' : '0' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            Full: {day.fullSync}
                                        </div>
                                    </div>
                                    {/* Incremental Sync Bar */}
                                    <div
                                        className="w-5 bg-emerald-500 rounded-t transition-all duration-500 hover:bg-emerald-600 cursor-pointer relative group"
                                        style={{ height: `${(day.incrementalSync / maxValue) * 100}%`, minHeight: day.incrementalSync > 0 ? '8px' : '0' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                            Inc: {day.incrementalSync}
                                        </div>
                                    </div>
                                </div>
                                {/* Date Label */}
                                <span className="text-xs text-gray-500 font-medium">{formatDate(day.date)}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary Row */}
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-3 gap-4 text-center">
                    <div>
                        <p className="text-2xl font-bold text-blue-600">
                            {chartData.reduce((sum, d) => sum + (d.fullSync || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500">Full Syncs</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-emerald-600">
                            {chartData.reduce((sum, d) => sum + (d.incrementalSync || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500">Incremental</p>
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-gray-700">
                            {chartData.reduce((sum, d) => sum + (d.fullSuccess || 0) + (d.incrementalSuccess || 0), 0)}
                        </p>
                        <p className="text-xs text-gray-500">Successful</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
