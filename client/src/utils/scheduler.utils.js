import { calculateNextPaymentDate, toISTDateString } from './date.utils';

/**
 * Calculates the preview of installment dates for a recurring transaction.
 * @param {string|Date} startDate - Start date (YYYY-MM-DD or Date object)
 * @param {string|Date} endDate - End date (YYYY-MM-DD or Date object)
 * @param {string} frequency - DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY
 * @returns {Array<Date>} List of valid execution dates
 */
export const calculateSchedulePreview = (startDate, endDate, frequency) => {
    let dates = [];

    if (!startDate || !frequency) return dates;

    // Normalize to YYYY-MM-DD strings for consistent comparison
    // This avoids all timezone shifts and ensuring strict date arithmetic
    let currentStr = typeof startDate === 'string' ? startDate : toISTDateString(startDate);
    const endStr = endDate ? (typeof endDate === 'string' ? endDate : toISTDateString(endDate)) : null;

    // Safety break (max 500 installments to prevent infinite loops in preview)
    const MAX_PREVIEW = 500;

    // If start date is strictly after end date, return empty
    // String comparison works for ISO dates: "2025-01-10" > "2025-01-09" is true
    if (endStr && currentStr > endStr) return dates;

    while (!endStr || currentStr <= endStr) {
        // Push Date object (UTC Midnight) for UI consumption
        // new Date('2025-01-10') creates UTC midnight
        dates.push(new Date(currentStr));

        // Calculate next date (Returns YYYY-MM-DD string)
        currentStr = calculateNextPaymentDate(currentStr, frequency);

        if (dates.length >= MAX_PREVIEW) break;
    }
    return dates;
};
