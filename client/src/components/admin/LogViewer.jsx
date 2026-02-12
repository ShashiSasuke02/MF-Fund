import React, { useState, useEffect } from 'react';
import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (envApiUrl && envApiUrl !== 'undefined') ? envApiUrl : '';

const TAB_LOGS = 'logs';
const TAB_BACKUPS = 'backups';

const LogViewer = () => {
    const [activeTab, setActiveTab] = useState(TAB_LOGS);
    const [logs, setLogs] = useState([]);
    const [backups, setBackups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const getToken = () => {
        const token = sessionStorage.getItem('auth_token');
        if (!token) setError('Authentication required. Please login again.');
        return token;
    };

    const fetchLogs = async () => {
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            if (!token) { setLoading(false); return; }

            const response = await axios.get(`${API_URL}/api/admin/logs`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) setLogs(response.data.files);
        } catch (err) {
            setError('Failed to fetch logs. Ensure you have admin permissions.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const fetchBackups = async () => {
        setLoading(true);
        setError('');
        try {
            const token = getToken();
            if (!token) { setLoading(false); return; }

            const response = await axios.get(`${API_URL}/api/admin/backups`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.data.success) setBackups(response.data.files);
        } catch (err) {
            setError('Failed to fetch backups.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === TAB_LOGS) fetchLogs();
        else fetchBackups();
    }, [activeTab]);

    const handleDownload = (filename) => {
        const token = getToken();
        if (!token) return;
        const basePath = activeTab === TAB_LOGS ? 'logs' : 'backups';
        const downloadUrl = `${API_URL}/api/admin/${basePath}/download/${filename}?token=${encodeURIComponent(token)}`;
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleDownloadAll = () => {
        const token = getToken();
        if (!token) return;
        const basePath = activeTab === TAB_LOGS ? 'logs' : 'backups';
        const downloadUrl = `${API_URL}/api/admin/${basePath}/download-all?token=${encodeURIComponent(token)}`;
        window.location.href = downloadUrl;
    };

    const formatSize = (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const currentItems = activeTab === TAB_LOGS ? logs : backups;
    const refreshFn = activeTab === TAB_LOGS ? fetchLogs : fetchBackups;

    return (
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            {/* Tab Bar */}
            <div className="flex border-b border-slate-200">
                <button
                    onClick={() => setActiveTab(TAB_LOGS)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors
                        ${activeTab === TAB_LOGS
                            ? 'text-emerald-700 border-b-2 border-emerald-600 bg-emerald-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        System Logs
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab(TAB_BACKUPS)}
                    className={`flex-1 px-4 py-3 text-sm font-semibold text-center transition-colors
                        ${activeTab === TAB_BACKUPS
                            ? 'text-blue-700 border-b-2 border-blue-600 bg-blue-50/50'
                            : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                        }`}
                >
                    <span className="flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                        </svg>
                        Database Backups
                    </span>
                </button>
            </div>

            {/* Header Actions */}
            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                <h3 className="text-lg font-bold text-slate-800">
                    {activeTab === TAB_LOGS ? 'System Logs' : 'Database Backups'}
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleDownloadAll}
                        className={`text-sm px-3 py-1.5 text-white rounded flex items-center gap-2 transition-colors
                            ${activeTab === TAB_LOGS
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        disabled={loading || currentItems.length === 0}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Download All
                    </button>
                    <button
                        onClick={refreshFn}
                        className="text-sm px-3 py-1.5 bg-white border border-slate-300 rounded hover:bg-slate-50 flex items-center gap-2 transition-colors"
                        disabled={loading}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                )}

                {loading && currentItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
                        Loading {activeTab === TAB_LOGS ? 'logs' : 'backups'}...
                    </div>
                ) : currentItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic">
                        {activeTab === TAB_LOGS ? 'No logs available.' : 'No backups available. Backups are created daily at 2 AM IST.'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3">Filename</th>
                                    <th className="px-4 py-3">Size</th>
                                    <th className="px-4 py-3">Last Modified</th>
                                    <th className="px-4 py-3 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentItems.map((item) => (
                                    <tr key={item.name} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-700 font-mono text-xs md:text-sm">{item.name}</td>
                                        <td className="px-4 py-3 text-slate-600">{formatSize(item.size)}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                            {new Date(item.modified).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDownload(item.name)}
                                                className={`font-medium hover:underline inline-flex items-center gap-1 transition-colors
                                                    ${activeTab === TAB_LOGS
                                                        ? 'text-emerald-600 hover:text-emerald-800'
                                                        : 'text-blue-600 hover:text-blue-800'
                                                    }`}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                                </svg>
                                                Download
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                <div className="mt-4 text-xs text-slate-400 text-center">
                    {activeTab === TAB_LOGS
                        ? 'Logs are retained for 7 days. JSON format.'
                        : 'Backups are retained for 7 days. Contains: users, accounts, holdings, transactions, ledger, funds.'}
                </div>
            </div>
        </div>
    );
};

export default LogViewer;
