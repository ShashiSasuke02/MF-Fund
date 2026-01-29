import { useState, useEffect } from 'react';
import { notificationApi } from '../api';

export default function LoginAlerts() {
    const [alert, setAlert] = useState(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        fetchAlerts();
    }, []);

    const fetchAlerts = async () => {
        try {
            const response = await notificationApi.getNotifications();
            if (response && response.success) {
                // Filter for unread alerts (SUCCESS or ERROR)
                // prioritizing the most recent one
                const criticalAlert = response.data.find(n =>
                    !n.is_read &&
                    (n.type === 'SUCCESS' || n.type === 'ERROR')
                );

                if (criticalAlert) {
                    setAlert(criticalAlert);
                    // Small delay for smooth entrance after page load
                    setTimeout(() => setIsVisible(true), 800);
                }
            }
        } catch (error) {
            console.error('Failed to fetch login alerts:', error);
        }
    };

    const handleClose = async () => {
        if (!alert) return;

        setIsVisible(false);

        // Mark as read so it doesn't show again
        try {
            await notificationApi.markAsRead(alert.id);
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
        }
    };

    if (!alert) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={handleClose}
            />

            {/* Modal */}
            <div className={`fixed inset-0 z-[70] flex items-center justify-center p-4 pointer-events-none`}>
                <div
                    className={`bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 pointer-events-auto ${isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
                        }`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className={`p-6 rounded-t-2xl flex flex-col items-center ${alert.type === 'SUCCESS'
                        ? 'bg-gradient-to-br from-emerald-50 to-teal-50'
                        : 'bg-gradient-to-br from-red-50 to-orange-50'
                        }`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${alert.type === 'SUCCESS'
                            ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                            : 'bg-gradient-to-br from-red-500 to-orange-600'
                            }`}>
                            {alert.type === 'SUCCESS' ? (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            )}
                        </div>

                        <h2 className={`text-xl font-bold text-center ${alert.type === 'SUCCESS' ? 'text-emerald-900' : 'text-red-900'
                            }`}>
                            {alert.title}
                        </h2>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 text-center leading-relaxed text-lg mb-6">
                            {alert.message}
                        </p>

                        <button
                            onClick={handleClose}
                            className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${alert.type === 'SUCCESS'
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200'
                                : 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-200'
                                }`}
                        >
                            {alert.type === 'SUCCESS' ? 'Awesome!' : 'Review Now'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
