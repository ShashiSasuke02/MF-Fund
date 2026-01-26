import { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';
import { useIdleTimer } from '../hooks/useIdleTimer';
import SessionTimeoutModal from '../components/SessionTimeoutModal';

const IdleContext = createContext(null);

export function IdleProvider({ children }) {
    const { logout, isAuthenticated } = useAuth();
    const [showModal, setShowModal] = useState(false);

    const handleIdle = () => {
        if (isAuthenticated) {
            logout();
            sessionStorage.setItem('logoutReason', 'idle');
            window.location.href = '/login'; // Force redirect
        }
    };

    const handleWarning = () => {
        if (isAuthenticated) {
            setShowModal(true);
        }
    };

    const { resetTimer, isWarning } = useIdleTimer({
        onIdle: handleIdle,
        onWarning: handleWarning
    });

    const handleStayLoggedIn = () => {
        resetTimer();
        setShowModal(false);
    };

    return (
        <IdleContext.Provider value={{ resetTimer }}>
            {children}
            {isAuthenticated && showModal && (
                <SessionTimeoutModal
                    onConfirm={handleStayLoggedIn}
                    isWarning={isWarning}
                />
            )}
        </IdleContext.Provider>
    );
}

export function useIdle() {
    return useContext(IdleContext);
}
