
import { useState } from 'react';

export default function CronJobItem({ job, onRun, onShowHistory }) {
    const [running, setRunning] = useState(false);

    const formatLastRun = (lastRun) => {
        if (!lastRun) return 'Never';
        const date = new Date(lastRun.startTime).toLocaleString();
        const status = lastRun.status;
        const duration = lastRun.duration ? `(${lastRun.duration}ms)` : '';

        return (
            <span className="flex items-center gap-2">
                <span className="text-gray-600">{date}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                    status === 'FAILED' ? 'bg-red-100 text-red-700' :
                        'bg-blue-100 text-blue-700'
                    }`}>
                    {status}
                </span>
                <span className="text-gray-400 text-xs italic">{duration}</span>
            </span>
        );
    };

    const handleRun = async () => {
        setRunning(true);
        try {
            await onRun(job.name);
        } finally {
            setRunning(false);
        }
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-gray-50">
            <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900">{job.name}</h3>
                    <span className={`w-2 h-2 rounded-full ${job.isEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mt-3">
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Schedule</p>
                        <p className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-0.5 rounded inline-block mt-0.5">{job.schedule}</p>
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</p>
                        <p className="text-sm font-medium mt-0.5 capitalize">
                            {job.isEnabled ? (job.schedule === 'MANUAL_ONLY' ? 'Manual Trigger Only' : 'Enabled/Scheduled') : 'Disabled (Internal Cache/Sync)'}
                        </p>
                    </div>
                    <div className="sm:col-span-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Last Run</p>
                        <div className="mt-0.5">{formatLastRun(job.lastRun)}</div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-2 mt-4 md:mt-0">
                <button
                    onClick={handleRun}
                    disabled={running}
                    className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                    {running ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Triggering...
                        </>
                    ) : (
                        'Run Now'
                    )}
                </button>
                <button
                    onClick={() => onShowHistory(job.name)}
                    className="flex-1 md:flex-none px-4 py-2 text-sm font-semibold border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    History
                </button>
            </div>
        </div>
    );
}
