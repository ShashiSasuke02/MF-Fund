/**
 * Unit Tests for Scheduler Service
 * Tests automated transaction execution, scheduling, and stop conditions
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Define mock handles
const mockTransactionModel = {
  findDueTransactions: jest.fn(),
  lockForExecution: jest.fn(),
  unlock: jest.fn(),
  updateExecutionStatus: jest.fn(),
  releaseStaleAccess: jest.fn()
};

const mockExecutionLogModel = {
  create: jest.fn()
};

const mockDemoAccountModel = {
  findByUserId: jest.fn(),
  updateBalance: jest.fn()
};

const mockHoldingModel = {
  findByScheme: jest.fn(),
  addUnits: jest.fn(),
  removeUnits: jest.fn(),
  updateCurrentValue: jest.fn(),
  upsert: jest.fn()
};

const mockNotificationModel = {
  create: jest.fn()
};

const mockLocalFundService = {
  getLatestNAV: jest.fn()
};

const mockRun = jest.fn();
const mockQueryOne = jest.fn();

// Native ESM Mocking
jest.unstable_mockModule('../../../src/models/transaction.model.js', () => ({
  transactionModel: mockTransactionModel
}));

jest.unstable_mockModule('../../../src/models/executionLog.model.js', () => ({
  executionLogModel: mockExecutionLogModel
}));

jest.unstable_mockModule('../../../src/models/demoAccount.model.js', () => ({
  demoAccountModel: mockDemoAccountModel
}));

jest.unstable_mockModule('../../../src/models/holding.model.js', () => ({
  holdingModel: mockHoldingModel
}));

jest.unstable_mockModule('../../../src/models/notification.model.js', () => ({
  notificationModel: mockNotificationModel
}));

jest.unstable_mockModule('../../../src/services/localFund.service.js', () => ({
  localFundService: mockLocalFundService
}));

jest.unstable_mockModule('../../../src/db/database.js', () => ({
  run: mockRun,
  queryOne: mockQueryOne,
  query: jest.fn(),
  saveDatabase: jest.fn(),
  getDatabase: jest.fn(),
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  escape: jest.fn(val => val),
  default: {
    run: mockRun,
    queryOne: mockQueryOne,
    query: jest.fn()
  }
}));

// Import service after mocks
const { schedulerService } = await import('../../../src/services/scheduler.service.js');

describe('Scheduler Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeDueTransactions', () => {
    it('should return empty result when no transactions are due', async () => {
      mockTransactionModel.releaseStaleAccess.mockResolvedValueOnce(0);
      mockTransactionModel.findDueTransactions.mockResolvedValueOnce([]);

      const result = await schedulerService.executeDueTransactions('2026-01-16');

      expect(result.totalDue).toBe(0);
      expect(result.executed).toBe(0);
      expect(mockTransactionModel.findDueTransactions).toHaveBeenCalledWith('2026-01-16');
    });

    it('should process all due transactions', async () => {
      const transactions = [{ id: 1, transaction_type: 'SIP', user_id: 1, amount: 5000, execution_count: 0, frequency: 'MONTHLY' }];
      mockTransactionModel.releaseStaleAccess.mockResolvedValueOnce(0);
      mockTransactionModel.findDueTransactions.mockResolvedValueOnce(transactions);

      // Mock internal execution methods indirectly by mocking models they use
      mockTransactionModel.lockForExecution.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockResolvedValue({ balance: 1000000 });
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '100.00' });
      mockHoldingModel.findByScheme.mockResolvedValue(null);
      mockTransactionModel.updateExecutionStatus.mockResolvedValueOnce(true);
      mockTransactionModel.unlock.mockResolvedValue(true);

      const result = await schedulerService.executeDueTransactions('2026-01-16');

      expect(result.totalDue).toBe(1);
      expect(result.executed).toBe(1);
      expect(result.failed).toBe(0);
    });
  });

  describe('executeScheduledTransaction', () => {
    const transaction = { id: 1, transaction_type: 'SIP', user_id: 1, amount: 5000, execution_count: 0, frequency: 'MONTHLY' };

    it('should skip execution if lock cannot be acquired', async () => {
      mockTransactionModel.lockForExecution.mockResolvedValueOnce(false);

      const result = await schedulerService.executeScheduledTransaction(transaction, '2026-01-16');

      expect(result.status).toBe('SKIPPED');
      expect(result.message).toContain('locked');
      expect(mockExecutionLogModel.create).toHaveBeenCalled();
    });

    it('should execute SIP successfully', async () => {
      mockTransactionModel.lockForExecution.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockResolvedValue({ balance: 1000000 });
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '2500.00' });
      mockHoldingModel.findByScheme.mockResolvedValue(null);

      const result = await schedulerService.executeScheduledTransaction(transaction, '2026-01-16');

      expect(result.status).toBe('SUCCESS');
      expect(mockTransactionModel.updateExecutionStatus).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ status: 'SUCCESS' })
      );
    });

    it('should handle insufficient balance error', async () => {
      mockTransactionModel.lockForExecution.mockResolvedValueOnce(true);
      mockDemoAccountModel.findByUserId.mockResolvedValue({ balance: 100 }); // Low balance
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '1000.00' });

      const result = await schedulerService.executeScheduledTransaction(transaction, '2026-01-16');

      expect(result.status).toBe('FAILED');
      expect(result.message).toContain('Insufficient balance');
      expect(mockNotificationModel.create).toHaveBeenCalledWith(expect.objectContaining({ type: 'ERROR' }));
    });
  });

  describe('executeSIP', () => {
    const transaction = { user_id: 1, scheme_code: 101, amount: 5000 };

    it('should execute SIP and update holdings', async () => {
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '100.00' });
      mockDemoAccountModel.findByUserId.mockResolvedValueOnce({ balance: 100000 });
      mockHoldingModel.findByScheme.mockResolvedValueOnce(null);

      const result = await schedulerService.executeSIP(transaction);

      expect(result.units).toBe(50);
      expect(mockHoldingModel.upsert).toHaveBeenCalled();
      expect(mockDemoAccountModel.updateBalance).toHaveBeenCalledWith(1, 95000);
    });
  });

  describe('executeSWP', () => {
    const transaction = { user_id: 1, scheme_code: 101, amount: 5000 };

    it('should execute SWP and credit balance', async () => {
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '100.00' });
      mockHoldingModel.findByScheme.mockResolvedValueOnce({ total_units: 100, invested_amount: 10000 });
      mockDemoAccountModel.findByUserId.mockResolvedValueOnce({ balance: 10000 });

      const result = await schedulerService.executeSWP(transaction);

      expect(result.units).toBe(50);
      expect(mockHoldingModel.removeUnits).toHaveBeenCalledWith(1, 101, 50, expect.any(Number));
      expect(mockDemoAccountModel.updateBalance).toHaveBeenCalledWith(1, 15000);
    });

    it('should throw error for insufficient units in SWP', async () => {
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '100.00' });
      mockHoldingModel.findByScheme.mockResolvedValueOnce({ total_units: 10 }); // Only 10 units

      await expect(schedulerService.executeSWP(transaction)).rejects.toThrow('Insufficient units');
    });
  });

  describe('calculateNextExecutionDate', () => {
    it('should calculate next monthly execution date', () => {
      const result = schedulerService.calculateNextExecutionDate('2026-01-16', 'MONTHLY');
      expect(result).toBe('2026-02-16');
    });

    it('should correctly handle YEARLY frequency', () => {
      const result = schedulerService.calculateNextExecutionDate('2026-01-16', 'YEARLY');
      expect(result).toBe('2027-01-16');
    });

    it('should throw error for unsupported frequency', () => {
      expect(() => schedulerService.calculateNextExecutionDate('2026-01-16', 'INVALID'))
        .toThrow('Unsupported frequency: INVALID');
    });
  });

  describe('checkStopConditions', () => {
    it('should return true when installments are completed', async () => {
      const transaction = { installments: 12, execution_count: 12 };
      const result = await schedulerService.checkStopConditions(transaction, '2026-01-16');
      expect(result.shouldStop).toBe(true);
    });

    it('should return true when end date is exceeded', async () => {
      const transaction = { end_date: '2025-12-31' };
      const result = await schedulerService.checkStopConditions(transaction, '2026-01-16');
      expect(result.shouldStop).toBe(true);
    });
  });
});
