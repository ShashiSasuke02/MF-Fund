import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Model and Logger
const mockLedgerModel = {
    getEntriesByUser: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../../../src/models/ledger.model.js', () => ({
    default: mockLedgerModel
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: mockLogger
}));

// Import Service
const ledgerService = (await import('../../../src/services/ledger.service.js')).default;

describe('LedgerService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getUserLedger', () => {
        it('should return formatted ledger data', async () => {
            const userId = 1;
            const mockData = {
                entries: [{ id: 1 }],
                total: 25
            };

            mockLedgerModel.getEntriesByUser.mockResolvedValueOnce(mockData);

            const result = await ledgerService.getUserLedger(userId, 2, 10);

            expect(result).toEqual({
                data: mockData.entries,
                pagination: {
                    total: 25,
                    page: 2,
                    limit: 10,
                    totalPages: 3
                }
            });
            // page 2, limit 10 -> offset 10
            expect(mockLedgerModel.getEntriesByUser).toHaveBeenCalledWith(userId, 10, 10);
        });

        it('should handle errors and log them', async () => {
            const error = new Error('Service Error');
            mockLedgerModel.getEntriesByUser.mockRejectedValueOnce(error);

            await expect(ledgerService.getUserLedger(1)).rejects.toThrow('Service Error');
            expect(mockLogger.error).toHaveBeenCalledWith(
                expect.stringContaining('Error getting user ledger'),
                expect.any(Object)
            );
        });
    });
});
