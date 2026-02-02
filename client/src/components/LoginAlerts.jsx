import { useState, useEffect } from 'react';
import { notificationApi } from '../api';

/**
 * LoginAlerts - Sequential Notification Popup System
 * Shows unread notifications one-by-one as modal dialogs.
 * User clicks "OK" to dismiss and see the next notification.
 * 
 * Props:
 * - showAfterPerformance: boolean - If true, show alerts. If false, wait.
 */
export default function LoginAlerts({ showAfterPerformance = true }) {
    const [alerts, setAlerts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);

    // Fetch alerts when component mounts or when showAfterPerformance becomes true
    useEffect(() => {
        if (showAfterPerformance && !hasFetched) {
            fetchAlerts();
            setHasFetched(true);
        }
    }, [showAfterPerformance, hasFetched]);

    // Show alerts when showAfterPerformance becomes true AND we have alerts
    useEffect(() => {
        if (showAfterPerformance && alerts.length > 0 && !isVisible) {
            // Small delay for smooth entrance
            const timer = setTimeout(() => setIsVisible(true), 500);
            return () => clearTimeout(timer);
        }
    }, [showAfterPerformance, alerts]);

    const fetchAlerts = async () => {
        try {
            const response = await notificationApi.getNotifications();
            if (response && response.success && response.data.length > 0) {
                // Store all unread notifications (oldest first for sequential display)
                const unreadAlerts = response.data
                    .filter(n => !n.is_read)
                    .reverse(); // Oldest first

                if (unreadAlerts.length > 0) {
                    setAlerts(unreadAlerts);
                }
            }
        } catch (error) {
            console.error('Failed to fetch login alerts:', error);
        }
    };

    const handleClose = async () => {
        const currentAlert = alerts[currentIndex];
        if (!currentAlert) return;

        setIsVisible(false);

        // Mark current alert as read
        try {
            await notificationApi.markAsRead(currentAlert.id);
        } catch (error) {
            console.error('Failed to mark alert as read:', error);
        }

        // Check if there are more alerts
        const nextIndex = currentIndex + 1;
        if (nextIndex < alerts.length) {
            // Show next alert after animation
            setTimeout(() => {
                setCurrentIndex(nextIndex);
                setIsVisible(true);
            }, 300);
        } else {
            // All done, clear alerts
            setAlerts([]);
            setCurrentIndex(0);
        }
    };

    // Don't render anything if we shouldn't show yet or no alerts
    if (!showAfterPerformance) return null;

    // Get current alert to display
    const currentAlert = alerts[currentIndex];
    const remainingCount = alerts.length - currentIndex;

    if (!currentAlert) return null;

    // Determine styles based on notification type
    const getStyles = (type) => {
        switch (type) {
            case 'SUCCESS':
                return {
                    headerBg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
                    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
                    titleColor: 'text-emerald-900',
                    buttonBg: 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-emerald-200',
                    buttonText: remainingCount > 1 ? 'OK, Next →' : 'Awesome!'
                };
            case 'ERROR':
                return {
                    headerBg: 'bg-gradient-to-br from-red-50 to-orange-50',
                    iconBg: 'bg-gradient-to-br from-red-500 to-orange-600',
                    titleColor: 'text-red-900',
                    buttonBg: 'bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700 shadow-red-200',
                    buttonText: remainingCount > 1 ? 'OK, Next →' : 'Review Now'
                };
            default: // INFO
                return {
                    headerBg: 'bg-gradient-to-br from-blue-50 to-indigo-50',
                    iconBg: 'bg-gradient-to-br from-blue-500 to-indigo-600',
                    titleColor: 'text-blue-900',
                    buttonBg: 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-blue-200',
                    buttonText: remainingCount > 1 ? 'OK, Next →' : 'Got It!'
                };
        }
    };

    const styles = getStyles(currentAlert.type);

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
                    <div className={`p-6 rounded-t-2xl flex flex-col items-center ${styles.headerBg}`}>
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg ${styles.iconBg}`}>
                            {currentAlert.type === 'SUCCESS' ? (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            ) : currentAlert.type === 'ERROR' ? (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </div>

                        <h2 className={`text-xl font-bold text-center ${styles.titleColor}`}>
                            {currentAlert.title}
                        </h2>

                        {/* Notification Counter Badge */}
                        {remainingCount > 1 && (
                            <div className="mt-3 flex justify-center">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white/80 text-gray-600 shadow-sm">
                                    {remainingCount} notifications remaining
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                        <p className="text-gray-600 text-center leading-relaxed text-lg mb-2">
                            {currentAlert.message}
                        </p>
                        <p className="text-xs text-gray-400 text-center mb-6">
                            {new Date(currentAlert.created_at).toLocaleDateString()} {new Date(currentAlert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>

                        <button
                            onClick={handleClose}
                            className={`w-full py-3.5 px-6 rounded-xl font-bold text-white shadow-lg transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${styles.buttonBg}`}
                        >
                            {styles.buttonText}
                        </button>
                    </div>

                    {/* Decorative Bottom Border */}
                    <div className={`h-2 rounded-b-2xl ${styles.buttonBg.split(' ')[0]}`} />
                </div>
            </div>
        </>
    );
}
