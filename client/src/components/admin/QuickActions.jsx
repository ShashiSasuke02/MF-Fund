import { useState } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '';

/**
 * QuickActions Component
 * Provides quick administrative actions
 */
export default function QuickActions({ onActionComplete }) {
    const [clearing, setClearing] = useState(false);
    const [message, setMessage] = useState(null);

    const handleClearCache = async () => {
        if (!confirm('Are you sure you want to clear the API cache?')) return;

        setClearing(true);
        setMessage(null);

        try {
            const token = sessionStorage.getItem('auth_token');
            const res = await axios.post(`${API_URL}/api/admin/cache/clear`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: res.data.message });
            if (onActionComplete) onActionComplete();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to clear cache' });
        } finally {
            setClearing(false);
        }
    };

    const handleTriggerSync = async (syncType) => {
        const jobName = syncType === 'full' ? 'Full Fund Sync' : 'Incremental Fund Sync';

        try {
            const token = sessionStorage.getItem('auth_token');
            await axios.post(`${API_URL}/api/cron/trigger`, { jobName }, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setMessage({ type: 'success', text: `${jobName} triggered successfully` });
            if (onActionComplete) onActionComplete();
        } catch (err) {
            setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to trigger sync' });
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-xl">
                        <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Quick Actions</h3>
                        <p className="text-sm text-gray-500">Administrative controls</p>
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="p-6">
                {/* Message */}
                {message && (
                    <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                        {message.text}
                    </div>
                )}

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Clear Cache */}
                    <button
                        onClick={handleClearCache}
                        disabled={clearing}
                        className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-xl border border-red-100 hover:bg-red-100 transition-colors cursor-pointer disabled:opacity-50"
                    >
                        <div className="p-2 bg-red-100 rounded-lg">
                            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Clear Cache</span>
                    </button>

                    {/* Full Sync */}
                    <button
                        onClick={() => handleTriggerSync('full')}
                        className="flex flex-col items-center gap-2 p-4 bg-blue-50 rounded-xl border border-blue-100 hover:bg-blue-100 transition-colors cursor-pointer"
                    >
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Full Sync</span>
                    </button>

                    {/* Incremental Sync */}
                    <button
                        onClick={() => handleTriggerSync('incremental')}
                        className="flex flex-col items-center gap-2 p-4 bg-emerald-50 rounded-xl border border-emerald-100 hover:bg-emerald-100 transition-colors cursor-pointer"
                    >
                        <div className="p-2 bg-emerald-100 rounded-lg">
                            <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">NAV Sync</span>
                    </button>

                    {/* Refresh All */}
                    <button
                        onClick={() => { setMessage(null); if (onActionComplete) onActionComplete(); }}
                        className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                        <div className="p-2 bg-gray-200 rounded-lg">
                            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">Refresh</span>
                    </button>
                </div>
            </div>
        </div>
    );
}
