import React, { useState, useEffect } from 'react';

export default function SessionTimeoutModal({ onConfirm }) {
    const [countdown, setCountdown] = useState(60);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-400 animate-bounce-in">
                <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>

                    <h3 className="text-xl font-bold text-gray-900 mb-2">Are you still there?</h3>

                    <p className="text-gray-600 mb-6">
                        For your security, you will be logged out in <span className="font-bold text-amber-600">{countdown} seconds</span> due to inactivity.
                    </p>

                    <button
                        onClick={onConfirm}
                        className="w-full py-3 px-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                    >
                        Stay Logged In
                    </button>
                </div>
            </div>
        </div>
    );
}
