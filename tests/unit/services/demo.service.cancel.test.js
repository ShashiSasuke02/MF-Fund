import { jest } from '@jest/globals';

// Define mocks BEFORE importing the module under test
jest.unstable_mockModule('../../../src/models/transaction.model.js', () => ({
    transactionModel: {
        findById: jest.fn(),
        updateExecutionStatus: jest.fn(),
    }
}));

// Mock other dependencies to prevent side effects
jest.unstable_mockModule('../../../src/models/demoAccount.model.js', () => ({ demoAccountModel: {} }));
jest.unstable_mockModule('../../../src/models/holding.model.js', () => ({ holdingModel: {} }));
jest.unstable_mockModule('../../../src/services/localFund.service.js', () => ({ localFundService: {} }));
jest.unstable_mockModule('../../../src/services/logger.service.js', () => ({
    default: { info: jest.fn(), error: jest.fn() } // Default export for logger
}));
jest.unstable_mockModule('../../../src/models/ledger.model.js', () => ({ default: {} }));
jest.unstable_mockModule('../../../src/utils/errors/AppError.js', () => ({ default: class AppError extends Error { } }));
jest.unstable_mockModule('../../../src/utils/date.utils.js', () => ({
    toISTDateString: jest.fn(),
    getISTDate: jest.fn(),
    calculateNextPaymentDate: jest.fn()
}));

// Import modules dynamically after mocking
const { demoService } = await import('../../../src/services/demo.service.js');
const { transactionModel } = await import('../../../src/models/transaction.model.js');

describe('Demo Service - Transaction Cancellation Fix', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('cancelTransaction should set status to CANCELLED instead of COMPLETED', async () => {
        const userId = 101;
        const transactionId = 505;

        // Mock findById to return a pending transaction
        transactionModel.findById.mockResolvedValue({
            id: transactionId,
            user_id: userId,
            status: 'PENDING'
        });

        // Mock updateExecutionStatus
        transactionModel.updateExecutionStatus.mockResolvedValue(true);

        const result = await demoService.cancelTransaction(userId, transactionId);

        expect(result.success).toBe(true);

        // Verify updateExecutionStatus was called with status: 'CANCELLED'
        expect(transactionModel.updateExecutionStatus).toHaveBeenCalledWith(
            transactionId,
            expect.objectContaining({
                status: 'CANCELLED',
                failureReason: 'Stopped by user'
            })
        );

        // Verify it was NOT called with COMPLETED
        expect(transactionModel.updateExecutionStatus).not.toHaveBeenCalledWith(
            transactionId,
            expect.objectContaining({
                status: 'COMPLETED'
            })
        );
    });

    test('should throw error if transaction not found', async () => {
        transactionModel.findById.mockResolvedValue(null);
        await expect(demoService.cancelTransaction(1, 1)).rejects.toThrow('Transaction not found');
    });

    test('should throw error if unauthorized', async () => {
        transactionModel.findById.mockResolvedValue({ id: 1, user_id: 999 });
        await expect(demoService.cancelTransaction(1, 1)).rejects.toThrow('Unauthorized');
    });
});
