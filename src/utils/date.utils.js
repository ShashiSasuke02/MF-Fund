/**
 * Date Utilities for IST (Asia/Kolkata) Timezone
 * 
 * These utilities ensure all business logic uses IST "Today" instead of UTC,
 * which fixes timezone-related bugs like double SIP execution near midnight.
 */

/**
 * Returns current date in IST (Asia/Kolkata) formatted as YYYY-MM-DD
 * Used to ensure "Today" is consistent regardless of Server UTC time.
 * @returns {string} Date in YYYY-MM-DD format (e.g., "2026-01-31")
 */
export const getISTDate = () => {
    return new Date().toLocaleDateString('en-CA', { // en-CA gives YYYY-MM-DD
        timeZone: 'Asia/Kolkata'
    });
};

/**
 * Returns a Date object representing the current time in IST
 * Useful for accurate hour/minute comparisons in IST.
 * @returns {Date} Date object adjusted for IST
 */
export const getISTTime = () => {
    return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
};

/**
 * Converts a Date object or string to IST date string (YYYY-MM-DD)
 * @param {Date|string} date - The date to convert
 * @returns {string} Date in YYYY-MM-DD format
 */
export const toISTDateString = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
    });
};

/**
 * Calculate next execution date based on frequency
 * @param {string} currentDate - Current execution date (YYYY-MM-DD)
 * @param {string} frequency - DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
 * @returns {string} Next execution date (YYYY-MM-DD)
 */
export const calculateNextPaymentDate = (currentDate, frequency) => {
    const current = new Date(currentDate);
    let next;

    switch (frequency) {
        case 'DAILY':
            next = new Date(current);
            next.setDate(current.getDate() + 1);
            break;

        case 'WEEKLY':
            next = new Date(current);
            next.setDate(current.getDate() + 7);
            break;

        case 'MONTHLY':
            next = new Date(current);
            next.setMonth(current.getMonth() + 1);
            break;

        case 'QUARTERLY':
            next = new Date(current);
            next.setMonth(current.getMonth() + 3);
            break;

        case 'YEARLY':
            next = new Date(current);
            next.setFullYear(current.getFullYear() + 1);
            break;

        default:
            throw new Error(`Unsupported frequency: ${frequency}`);
    }

    return toISTDateString(next);
};
