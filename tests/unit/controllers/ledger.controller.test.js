import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Mock Service and Logger
const mockLedgerService = {
    getUserLedger: jest.fn()
};

const mockLogger = {
    info: jest.fn(),
    error: jest.fn()
};

jest.unstable_mockModule('../../../src/services/ledger.service.js', () => ({
    default: mockLedgerService
}));

jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: mockLogger
}));

// Import Controller
const ledgerController = (await import('../../../src/controllers/ledger.controller.js')).default;

describe('LedgerController', () => {
    let req, res, next;

    beforeEach(() => {
        jest.clearAllMocks();
        req = {
            user: { id: 1 },
            query: {}
        };
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
        next = jest.fn();
    });

    describe('getLedger', () => {
        it('should get ledger with default pagination', async () => {
            req.query = {};
            const mockResult = { data: [], pagination: {} };
            mockLedgerService.getUserLedger.mockResolvedValueOnce(mockResult);

            await ledgerController.getLedger(req, res, next);

            expect(mockLedgerService.getUserLedger).toHaveBeenCalledWith(1, 1, 20);
            expect(res.json).toHaveBeenCalledWith({ success: true, ...mockResult });
        });

        it('should accept custom pagination params', async () => {
            req.query = { page: '5', limit: '50' };
            const mockResult = { data: [], pagination: {} };
            mockLedgerService.getUserLedger.mockResolvedValueOnce(mockResult);

            await ledgerController.getLedger(req, res, next);

            expect(mockLedgerService.getUserLedger).toHaveBeenCalledWith(1, 5, 50);
        });

        it('should handle errors', async () => {
            const error = new Error('Controller Error');
            mockLedgerService.getUserLedger.mockRejectedValueOnce(error);

            await ledgerController.getLedger(req, res, next);

            expect(next).toHaveBeenCalledWith(error);
            expect(mockLogger.error).toHaveBeenCalled();
        });
    });
});
