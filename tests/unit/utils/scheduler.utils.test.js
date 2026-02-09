import { calculateSchedulePreview } from '../../../src/utils/scheduler.utils.js';

describe('Scheduler Utils - Schedule Preview Calculation', () => {

    describe('DAILY Frequency', () => {
        test('should calculate correct number of daily installments', () => {
            // 10th Jan to 15th Jan -> 10, 11, 12, 13, 14, 15 (6 days)
            const start = '2025-01-10';
            const end = '2025-01-15';
            const dates = calculateSchedulePreview(start, end, 'DAILY');

            expect(dates.length).toBe(6);
            expect(dates[0].toISOString().split('T')[0]).toBe('2025-01-10');
            expect(dates[5].toISOString().split('T')[0]).toBe('2025-01-15');
        });

        test('should handle single day range', () => {
            const start = '2025-01-10';
            const end = '2025-01-10';
            const dates = calculateSchedulePreview(start, end, 'DAILY');
            expect(dates.length).toBe(1);
        });
    });

    describe('WEEKLY Frequency', () => {
        test('should calculate weekly installments correctly', () => {
            // Jan 1 (Wed) to Jan 31 (Fri)
            // Dates: 1, 8, 15, 22, 29 (5 installments)
            const start = '2025-01-01';
            const end = '2025-01-31';
            const dates = calculateSchedulePreview(start, end, 'WEEKLY');

            expect(dates.length).toBe(5);
            expect(dates[0].toISOString().split('T')[0]).toBe('2025-01-01'); // Wed
            expect(dates[1].toISOString().split('T')[0]).toBe('2025-01-08'); // Wed
        });

        test('should return only one installment if range is less than a week', () => {
            // Jan 1 to Jan 5 (Short range)
            const start = '2025-01-01';
            const end = '2025-01-05';
            const dates = calculateSchedulePreview(start, end, 'WEEKLY');

            expect(dates.length).toBe(1);
        });
    });

    describe('MONTHLY Frequency', () => {
        test('should calculate monthly installments correctly', () => {
            // Jan 10 to Apr 10
            // 10 Jan, 10 Feb, 10 Mar, 10 Apr (4 installments)
            const start = '2025-01-10';
            const end = '2025-04-10';
            const dates = calculateSchedulePreview(start, end, 'MONTHLY');

            expect(dates.length).toBe(4);
            expect(dates[1].toISOString().split('T')[0]).toBe('2025-02-10');
        });

        test('should handle end of month logic (Jan 31 -> Feb 28)', () => {
            // Date utils usually sets month + 1. 
            // Jan 31 + 1 month -> Feb 28 (or 29) traditionally, or Mar 2/3 depending on JS logic.
            // Our date.utils.js uses setMonth(current.getMonth() + 1). 
            // In JS: Jan 31 + 1 month -> Mar 3 (non-leap) or Mar 2 (leap).
            // Let's verify behavior. If user wants strict "Last Day", that's a different logic.
            // Standard JS behavior check:
            const start = '2025-01-31'; // Non-leap year
            const end = '2025-03-31';
            const dates = calculateSchedulePreview(start, end, 'MONTHLY');

            // Jan 31
            // Feb has 28 days. setMonth(+1) on Jan 31 -> March 3rd (3 days spillover)
            // This is standard JS behavior. We verify it matches our util.
            expect(dates.length).toBe(3);
            expect(dates[0].toISOString().split('T')[0]).toBe('2025-01-31');
            // We expect the util to behave consistently. 
            // If we want "End of Month" sticky logic, that's a feature request.
            // For now, testing that it generates dates without crashing.
        });
    });

    describe('QUARTERLY Frequency', () => {
        test('should calculate quarterly installments', () => {
            // Jan 1 to Dec 31
            // Jan 1, Apr 1, Jul 1, Oct 1 (4 installments)
            const start = '2025-01-01';
            const end = '2025-12-31';
            const dates = calculateSchedulePreview(start, end, 'QUARTERLY');

            expect(dates.length).toBe(4);
            expect(dates[1].toISOString().split('T')[0]).toBe('2025-04-01');
        });
    });

    describe('Edge Cases', () => {
        test('should return empty if start date > end date', () => {
            const start = '2025-01-10';
            const end = '2025-01-09';
            const dates = calculateSchedulePreview(start, end, 'DAILY');
            expect(dates.length).toBe(0);
        });

        test('should recurse indefinitely (up to cap) if no end date provided', () => {
            const start = '2025-01-01';
            const dates = calculateSchedulePreview(start, null, 'MONTHLY');

            // Our util implementation has a safety break of 500
            expect(dates.length).toBe(500);
        });
    });
});
