import { useState, useEffect } from 'react';
import axios from 'axios';

const envApiUrl = import.meta.env.VITE_API_URL;
const API_URL = (envApiUrl && envApiUrl !== 'undefined') ? envApiUrl : '';

export default function AiManager() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [status, setStatus] = useState(null);
    const [models, setModels] = useState([]);
    const [settings, setSettings] = useState({
        enabled: true,
        model: ''
    });
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const token = sessionStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };

            // Fetch AI status and models in parallel
            const [statusRes, modelsRes] = await Promise.all([
                axios.get(`${API_URL}/api/admin/ai/status`, { headers }),
                axios.get(`${API_URL}/api/admin/ai/models`, { headers }).catch(() => ({ data: { models: [] } }))
            ]);

            setStatus(statusRes.data.ai);
            setModels(modelsRes.data.models || []);
            setSettings({
                enabled: statusRes.data.ai?.enabled ?? true,
                model: statusRes.data.ai?.model || ''
            });
            setError(null);
        } catch (err) {
            setError('Failed to load AI settings');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            setError(null);
            setSuccess(null);

            const token = sessionStorage.getItem('auth_token');
            const headers = { Authorization: `Bearer ${token}` };

            // Save both settings
            await Promise.all([
                axios.post(`${API_URL}/api/admin/settings`, {
                    key: 'ai_enabled',
                    value: settings.enabled ? 'true' : 'false'
                }, { headers }),
                axios.post(`${API_URL}/api/admin/settings`, {
                    key: 'ai_model',
                    value: settings.model
                }, { headers })
            ]);

            setSuccess('AI settings saved successfully!');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">AI Assistant Manager</h3>
                            <p className="text-sm text-gray-600">Configure Ollama integration</p>
                        </div>
                    </div>

                    {/* Connection Status */}
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold ${status?.connected
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                        <span className={`w-2 h-2 rounded-full ${status?.connected ? 'bg-emerald-500' : 'bg-red-500'
                            }`}></span>
                        {status?.connected ? 'Connected' : 'Disconnected'}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
                {/* Alerts */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                        {error}
                    </div>
                )}
                {success && (
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                        {success}
                    </div>
                )}

                {/* Enable/Disable Toggle */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                        <p className="font-semibold text-gray-900">AI Assistant</p>
                        <p className="text-sm text-gray-500">Enable or disable AI chat globally</p>
                    </div>
                    <button
                        onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                        className={`relative w-14 h-7 rounded-full transition-colors ${settings.enabled ? 'bg-emerald-500' : 'bg-gray-300'
                            }`}
                    >
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.enabled ? 'translate-x-8' : 'translate-x-1'
                            }`}></span>
                    </button>
                </div>

                {/* Model Selector */}
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Active Model
                    </label>
                    <select
                        value={settings.model}
                        onChange={(e) => setSettings(s => ({ ...s, model: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    >
                        <option value="">-- Select Model --</option>
                        {models.map((model) => (
                            <option key={model.name} value={model.name}>
                                {model.name} ({(model.size / 1e9).toFixed(1)} GB)
                            </option>
                        ))}
                        {/* Allow custom input if not in list */}
                        {settings.model && !models.find(m => m.name === settings.model) && (
                            <option value={settings.model}>{settings.model} (current)</option>
                        )}
                    </select>
                    <p className="mt-2 text-xs text-gray-500">
                        Endpoint: <code className="bg-gray-100 px-1 rounded">{status?.endpoint}</code>
                    </p>
                </div>

                {/* Info Cards */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                        <p className="text-xs text-indigo-600 font-semibold uppercase">Current Model</p>
                        <p className="text-lg font-bold text-indigo-900 mt-1 truncate">
                            {status?.model || 'Not Set'}
                        </p>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                        <p className="text-xs text-purple-600 font-semibold uppercase">Available Models</p>
                        <p className="text-lg font-bold text-purple-900 mt-1">
                            {models.length}
                        </p>
                    </div>
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl shadow-lg shadow-indigo-200 hover:shadow-xl active:scale-[0.98] transition-all disabled:opacity-50"
                >
                    {saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
}
