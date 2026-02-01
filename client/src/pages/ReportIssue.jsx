import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { supportApi } from '../api';

export default function ReportIssue() {
    const { user, isAuthenticated } = useAuth();
    const [issueType, setIssueType] = useState('Feedback');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', message: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (description.length < 10) {
            setStatus({ type: 'error', message: 'Please provide at least 10 characters of detail.' });
            return;
        }

        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            const response = await supportApi.reportIssue({
                issueType,
                description
            });

            if (response.success) {
                setStatus({ type: 'success', message: response.message });
                setDescription('');
            } else {
                setStatus({ type: 'error', message: response.message || 'Failed to submit.' });
            }
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.message || error.response?.data?.message || 'Something went wrong. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h2>
                    <p className="text-gray-600 mb-6">You need to be logged in to report an issue.</p>
                    <Link
                        to="/login"
                        className="inline-block px-6 py-3 bg-emerald-500 text-white font-semibold rounded-xl hover:bg-emerald-600 transition-colors"
                    >
                        Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen py-12 px-4">
            <div className="max-w-xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Report an Issue</h1>
                    <p className="text-gray-600">Your feedback helps us improve TryMutualFunds</p>
                </div>

                {/* Form Card */}
                <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-100 p-8">
                    {/* Status Messages */}
                    {status.message && (
                        <div
                            className={`mb-6 p-4 rounded-xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                }`}
                        >
                            {status.type === 'success' ? (
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                            <span className="text-sm font-medium">{status.message}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* User Info (Read-only) */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Your Name</label>
                            <input
                                type="text"
                                value={user?.fullName || user?.full_name || user?.username || ''}
                                disabled
                                className="block w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-600"
                            />
                        </div>

                        {/* Issue Type */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Issue Type</label>
                            <div className="flex gap-3">
                                {['Bug', 'Feedback', 'Other'].map((type) => (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => setIssueType(type)}
                                        className={`flex-1 py-3 px-4 rounded-xl font-semibold text-sm transition-all border ${issueType === type
                                            ? 'bg-emerald-500 text-white border-emerald-500'
                                            : 'bg-white text-gray-700 border-gray-200 hover:border-emerald-300'
                                            }`}
                                    >
                                        {type === 'Bug' && '🐞 '}
                                        {type === 'Feedback' && '💡 '}
                                        {type === 'Other' && '📝 '}
                                        {type}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Please describe the issue or your feedback in detail..."
                                rows={5}
                                className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all resize-none"
                            />
                            <p className="text-xs text-gray-500 mt-1">{description.length} / 500 characters</p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading || description.length < 10}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none disabled:cursor-not-allowed"
                        >
                            {loading ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                    </form>
                </div>

                {/* Back Link */}
                <div className="text-center mt-6">
                    <Link to="/" className="text-emerald-600 hover:text-emerald-700 font-medium">
                        ← Back to Home
                    </Link>
                </div>
            </div>
        </div>
    );
}
