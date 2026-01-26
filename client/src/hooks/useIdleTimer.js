import { useState, useEffect, useRef } from 'react';

// Idle Timeout: 5 minutes (300,000 ms)
// Warning: 4 minutes (240,000 ms)
const TIMEOUT_MS = 5 * 60 * 1000;
const WARNING_MS = 4 * 60 * 1000;

export function useIdleTimer({ onIdle, onWarning }) {
    const [isWarning, setIsWarning] = useState(false);
    const lastActivityRef = useRef(Date.now());
    const timerRef = useRef(null);
    const warningTimerRef = useRef(null);

    const resetTimer = () => {
        lastActivityRef.current = Date.now();
        setIsWarning(false);

        if (timerRef.current) clearTimeout(timerRef.current);
        if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

        // Set Warning Timer
        warningTimerRef.current = setTimeout(() => {
            setIsWarning(true);
            if (onWarning) onWarning();
        }, WARNING_MS);

        // Set Logout Timer
        timerRef.current = setTimeout(() => {
            if (onIdle) onIdle();
        }, TIMEOUT_MS);
    };

    useEffect(() => {
        const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'];

        // Throttle reset to avoid performance hit
        let throttleTimeout;
        const handleActivity = () => {
            if (!throttleTimeout) {
                throttleTimeout = setTimeout(() => {
                    resetTimer();
                    throttleTimeout = null;
                }, 1000);
            }
        };

        events.forEach(event => window.addEventListener(event, handleActivity));

        // Initialize timer
        resetTimer();

        return () => {
            events.forEach(event => window.removeEventListener(event, handleActivity));
            if (timerRef.current) clearTimeout(timerRef.current);
            if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
            if (throttleTimeout) clearTimeout(throttleTimeout);
        };
    }, []);

    return {
        isWarning,
        resetTimer,
        remainingTime: Math.max(0, Math.ceil((TIMEOUT_MS - (Date.now() - lastActivityRef.current)) / 1000))
    };
}
