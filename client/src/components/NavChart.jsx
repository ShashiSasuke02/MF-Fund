import { useState, useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

/**
 * NAV Chart Component
 * Displays interactive NAV history chart with gradient fill
 * @param {Array} navHistory - Array of {date, nav} objects
 * @param {Object} branding - AMC branding config (optional)
 */
export default function NavChart({ navHistory = [], branding = {} }) {
    const [timeRange, setTimeRange] = useState('30d'); // 7d, 14d, 30d

    // Process and sort data chronologically
    const chartData = useMemo(() => {
        if (!navHistory || navHistory.length === 0) return [];

        // Sort by date ascending for chart
        const sorted = [...navHistory].sort((a, b) => {
            const dateA = new Date(a.date);
            const dateB = new Date(b.date);
            return dateA - dateB;
        });

        // Filter by time range
        const now = new Date();
        const days = timeRange === '7d' ? 7 : timeRange === '14d' ? 14 : 30;
        const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

        const filtered = sorted.filter(item => new Date(item.date) >= cutoff);

        return filtered.map(item => ({
            date: formatDate(item.date),
            nav: parseFloat(item.nav),
            fullDate: item.date,
        }));
    }, [navHistory, timeRange]);

    // Calculate min/max for Y-axis
    const { minNav, maxNav, change, changePercent } = useMemo(() => {
        if (chartData.length === 0) return { minNav: 0, maxNav: 0, change: 0, changePercent: 0 };

        const navValues = chartData.map(d => d.nav);
        const min = Math.min(...navValues);
        const max = Math.max(...navValues);
        const first = chartData[0]?.nav || 0;
        const last = chartData[chartData.length - 1]?.nav || 0;
        const diff = last - first;
        const percent = first > 0 ? (diff / first) * 100 : 0;

        return {
            minNav: min - (max - min) * 0.1,
            maxNav: max + (max - min) * 0.1,
            change: diff,
            changePercent: percent,
        };
    }, [chartData]);

    // Chart colors based on performance
    const isPositive = change >= 0;
    const gradientId = 'navGradient';
    const primaryColor = branding.primaryColor || (isPositive ? '#10b981' : '#ef4444');
    const strokeColor = isPositive ? '#059669' : '#dc2626';

    if (chartData.length === 0) {
        return (
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    NAV History
                </h3>
                <div className="text-center py-8 text-gray-500">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <p>No NAV history available</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200 p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                    </svg>
                    NAV History
                </h3>

                {/* Time Range Selector */}
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                    {['7d', '14d', '30d'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeRange(range)}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${timeRange === range
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            {range === '7d' ? '7 Days' : range === '14d' ? '14 Days' : '30 Days'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Performance Badge */}
            <div className="flex items-center gap-4 mb-4">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d={isPositive ? "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" : "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6"}
                        />
                    </svg>
                    {isPositive ? '+' : ''}{change.toFixed(4)} ({changePercent.toFixed(2)}%)
                </div>
                <span className="text-sm text-gray-500">
                    {chartData.length} data points
                </span>
            </div>

            {/* Chart */}
            <div className="h-64 sm:h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={primaryColor} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis
                            dataKey="date"
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            interval="preserveStartEnd"
                        />
                        <YAxis
                            domain={[minNav, maxNav]}
                            tick={{ fontSize: 11, fill: '#6b7280' }}
                            axisLine={{ stroke: '#e5e7eb' }}
                            tickLine={false}
                            tickFormatter={(value) => `₹${value.toFixed(2)}`}
                            width={65}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                            type="monotone"
                            dataKey="nav"
                            stroke={strokeColor}
                            strokeWidth={2}
                            fill={`url(#${gradientId})`}
                            animationDuration={500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// Custom Tooltip
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || !payload.length) return null;

    return (
        <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
            <p className="font-semibold mb-1">{label}</p>
            <p className="text-emerald-400">NAV: ₹{payload[0].value.toFixed(4)}</p>
        </div>
    );
}

// Format date for display
function formatDate(dateStr) {
    if (!dateStr) return '';

    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
        });
    } catch {
        return dateStr;
    }
}
