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
        // Jan 31 + 1 month = March 3 (standard JS) -> Sunk to Feb 28 (Business Logic)
        const result = calculateNextPaymentDate(currentDate, 'MONTHLY');
        expect(result).toBe('2026-02-28');
    });

    it('should calculate monthly frequency from mid-month', () => {
        expect(calculateNextPaymentDate('2026-01-15', 'MONTHLY')).toBe('2026-02-15');
    });

    it('should calculate QUARTERLY frequency', () => {
        // Jan 31 + 3 months -> Apr 30 (Sunk)
        expect(calculateNextPaymentDate('2026-01-31', 'QUARTERLY')).toBe('2026-04-30');
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
        // Feb 29, 2024 + 1 year = Feb 28, 2025 (Sunk from Mar 1)
        expect(calculateNextPaymentDate('2024-02-29', 'YEARLY')).toBe('2025-02-28');
    });
});
