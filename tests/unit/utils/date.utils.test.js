import { describe, it, expect } from '@jest/globals';
import { calculateNextPaymentDate } from '../../../src/utils/date.utils.js';

describe('Date Utils - calculateNextPaymentDate', () => {
    // Current date for all tests
    const currentDate = '2026-01-31';

    it('should calculate DAILY frequency', () => {
        // Jan 31 + 1 day = Feb 1
        expect(calculateNextPaymentDate(currentDate, 'DAILY')).toBe('2026-02-01');
    });

    it('should calculate WEEKLY frequency', () => {
        // Jan 31 + 7 days = Feb 7
        expect(calculateNextPaymentDate(currentDate, 'WEEKLY')).toBe('2026-02-07');
    });

    it('should calculate MONTHLY frequency', () => {
        // Jan 31 + 1 month = March 3 (Feb 2026 has 28 days) -> JavaScript handles overflow
        // Logic check: standard JS behavior for Jan 31 + 1 month is March 3 (non-leap) or March 2 (leap)
        // Let's verify standard behavior first
        const result = calculateNextPaymentDate(currentDate, 'MONTHLY');
        // Expecting '2026-03-03' because Feb 2026 has 28 days. 
        expect(result).toBe('2026-03-03');
    });

    it('should calculate monthly frequency from mid-month', () => {
        expect(calculateNextPaymentDate('2026-01-15', 'MONTHLY')).toBe('2026-02-15');
    });

    it('should calculate QUARTERLY frequency', () => {
        // Jan 15 + 3 months = Apr 15
        expect(calculateNextPaymentDate('2026-01-15', 'QUARTERLY')).toBe('2026-04-15');
    });

    it('should calculate YEARLY frequency', () => {
        // Jan 31 + 1 year = Jan 31, 2027
        expect(calculateNextPaymentDate(currentDate, 'YEARLY')).toBe('2027-01-31');
    });

    it('should throw error for invalid frequency', () => {
        expect(() => calculateNextPaymentDate(currentDate, 'INVALID')).toThrow('Unsupported frequency: INVALID');
    });

    it('should handle leap years correctly', () => {
        // 2024 was leap year. 2028 is next.
        // Let's check Feb 28, 2024 (Leap) + 1 day = Feb 29
        expect(calculateNextPaymentDate('2024-02-28', 'DAILY')).toBe('2024-02-29');
        // Feb 29, 2024 + 1 year = Feb 28, 2025 (standard JS behavior)
        expect(calculateNextPaymentDate('2024-02-29', 'YEARLY')).toBe('2025-03-01'); // JS default: Feb 29 -> Mar 1 in non-leap years
    });
});
