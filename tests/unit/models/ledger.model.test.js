import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock dependencies
const mockPool = {
    run: jest.fn(),
    query: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
};

// Mock modules
jest.unstable_mockModule('../../../src/db/database.js', () => ({
    default: mockPool
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: mockLogger
}));

// Import Model
const LedgerModel = (await import('../../../src/models/ledger.model.js')).default;

describe('LedgerModel', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createEntry', () => {
        it('should create a ledger entry successfully', async () => {
            const entryData = {
                userId: 1,
                transactionId: 101,
                amount: 5000,
                balanceAfter: 15000,
                type: 'CREDIT',
                description: 'Test Credit'
            };

            mockPool.run.mockResolvedValueOnce({ insertId: 1 });

            const result = await LedgerModel.createEntry(entryData);

            expect(result).toBe(1);
            expect(mockPool.run).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO ledger_entries'),
                [1, 101, 5000, 15000, 'CREDIT', 'Test Credit']
            );
            expect(mockLogger.info).toHaveBeenCalledWith(
                expect.stringContaining('Entry created'),
                expect.any(Object)
            );
        });

        it('should log error and throw if creation fails', async () => {
            const entryData = { userId: 1 };
            const error = new Error('DB Error');
            mockPool.run.mockRejectedValueOnce(error);

            await expect(LedgerModel.createEntry(entryData)).rejects.toThrow('DB Error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error creating entry'),
                expect.any(Object)
            );
        });
    });

    describe('getEntriesByUser', () => {
        it('should fetch entries with pagination', async () => {
            const userId = 1;
            const limit = 10;
            const offset = 0;
            const mockEntries = [{ id: 1, amount: 5000 }];

            mockPool.query
                .mockResolvedValueOnce(mockEntries) // entries query returns array directly
                .mockResolvedValueOnce([{ total: 1 }]); // count query returns array of rows

            const result = await LedgerModel.getEntriesByUser(userId, limit, offset);

            expect(result).toEqual({
                entries: mockEntries,
                total: 1
            });
            expect(mockPool.query).toHaveBeenCalledTimes(2);
        });

        it('should handle errors during fetch', async () => {
            const error = new Error('Fetch Error');
            mockPool.query.mockRejectedValueOnce(error);

            await expect(LedgerModel.getEntriesByUser(1)).rejects.toThrow('Fetch Error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error fetching entries'),
                expect.any(Object)
            );
        });
    });
});
