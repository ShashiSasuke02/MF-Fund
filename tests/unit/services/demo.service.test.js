/**
 * Unit Tests for Demo Service
 * Tests investment execution, portfolio management, and business logic
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Define mock handles
const mockDemoAccountModel = {
  getBalance: jest.fn(),
  updateBalance: jest.fn(),
  findByUserId: jest.fn()
};

const mockTransactionModel = {
  create: jest.fn(),
  findByUserId: jest.fn(),
  findActiveSystematicPlans: jest.fn()
};

const mockHoldingModel = {
  findByScheme: jest.fn(),
  upsert: jest.fn(),
  findByUserId: jest.fn(),
  removeUnits: jest.fn(),
  updateCurrentValue: jest.fn()
};

const mockLocalFundService = {
  getSchemeDetails: jest.fn(),
  getLatestNAV: jest.fn(),
  getFundWithNav: jest.fn()
};

const mockRun = jest.fn();
const mockQueryOne = jest.fn();
const mockQuery = jest.fn();

// Native ESM Mocking
jest.unstable_mockModule('../../../src/models/demoAccount.model.js', () => ({
  demoAccountModel: mockDemoAccountModel
}));

jest.unstable_mockModule('../../../src/models/transaction.model.js', () => ({
  transactionModel: mockTransactionModel
}));

jest.unstable_mockModule('../../../src/models/holding.model.js', () => ({
  holdingModel: mockHoldingModel
}));

jest.unstable_mockModule('../../../src/services/localFund.service.js', () => ({
  localFundService: mockLocalFundService,
  default: mockLocalFundService
}));

jest.unstable_mockModule('../../../src/db/database.js', () => ({
  run: mockRun,
  queryOne: mockQueryOne,
  query: mockQuery,
  getDatabase: jest.fn(),
  initializeDatabase: jest.fn(),
  closeDatabase: jest.fn(),
  saveDatabase: jest.fn(),
  escape: jest.fn(val => val),
  default: {
    run: mockRun,
    queryOne: mockQueryOne,
    query: mockQuery
  }
}));

// Import service after mocks
const { demoService } = await import('../../../src/services/demo.service.js');

describe('Demo Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('executeTransaction - Lump Sum', () => {
    const validLumpSumData = {
      userId: 1,
      schemeCode: 119091,
      transactionType: 'LUMP_SUM',
      amount: 10000
    };

    it('should execute lump sum investment successfully', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'HDFC Liquid Fund - Growth' },
        latestNav: { nav: '5341.1487', date: '2026-01-13' }
      });
      mockTransactionModel.create.mockResolvedValueOnce({
        id: 1,
        userId: 1,
        amount: 10000,
        status: 'SUCCESS'
      });
      mockHoldingModel.findByScheme.mockResolvedValueOnce(null);

      const result = await demoService.executeTransaction(validLumpSumData);

      expect(result).toHaveProperty('transaction');
      expect(result).toHaveProperty('newBalance', 990000);
      expect(mockDemoAccountModel.updateBalance).toHaveBeenCalledWith(1, 990000);
      expect(mockHoldingModel.upsert).toHaveBeenCalled();
    });

    it('should calculate units correctly', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'Test Fund' },
        latestNav: { nav: '100.00', date: '2026-01-14' }
      });
      mockTransactionModel.create.mockResolvedValueOnce({ id: 1 });
      mockHoldingModel.findByScheme.mockResolvedValueOnce(null);

      await demoService.executeTransaction({
        ...validLumpSumData,
        amount: 5000
      });

      // 5000 / 100 = 50 units
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          units: 50,
          amount: 5000,
          nav: 100
        })
      );
    });

    it('should reject investment with insufficient balance', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(5000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'Test Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });

      await expect(
        demoService.executeTransaction({
          ...validLumpSumData,
          amount: 10000
        })
      ).rejects.toThrow('Insufficient demo balance');
    });

    it('should reject invalid scheme code', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce(null);

      await expect(
        demoService.executeTransaction(validLumpSumData)
      ).rejects.toThrow(/Fund not found/);
    });

    it('should reject zero or negative amount', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'Test Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });

      await expect(
        demoService.executeTransaction({
          ...validLumpSumData,
          amount: 0
        })
      ).rejects.toThrow('Amount must be greater than zero');
    });
  });

  describe('executeTransaction - SIP', () => {
    const validSipData = {
      userId: 1,
      schemeCode: 119091,
      transactionType: 'SIP',
      amount: 5000,
      frequency: 'MONTHLY',
      startDate: new Date().toISOString().split('T')[0],
      installments: 12
    };

    it('should create immediate SIP successfully', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'HDFC SIP Fund' },
        latestNav: { nav: '2500.00', date: '2026-01-14' }
      });
      mockTransactionModel.create.mockResolvedValueOnce({ id: 1, status: 'SUCCESS' });
      mockHoldingModel.findByScheme.mockResolvedValueOnce(null);

      const result = await demoService.executeTransaction(validSipData);

      expect(result.transaction).toBeDefined();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'SIP',
          status: 'SUCCESS'
        })
      );
      expect(mockDemoAccountModel.updateBalance).toHaveBeenCalled();
    });

    it('should create future SIP as PENDING with Zero-Allocation', async () => {
      const futureDate = '2099-01-01';
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'Future SIP Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });
      mockTransactionModel.create.mockResolvedValueOnce({ id: 1, status: 'PENDING' });

      const result = await demoService.executeTransaction({
        ...validSipData,
        startDate: futureDate
      });

      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'PENDING',
          units: null,
          nav: null
        })
      );
      // Balance and holding should NOT be updated
      expect(mockDemoAccountModel.updateBalance).not.toHaveBeenCalled();
      expect(mockHoldingModel.upsert).not.toHaveBeenCalled();
    });

    it('should validate SIP frequency', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(1000000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'Test Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });

      await expect(
        demoService.executeTransaction({
          ...validSipData,
          frequency: 'INVALID'
        })
      ).rejects.toThrow(/Invalid frequency/);
    });
  });

  describe('executeTransaction - SWP', () => {
    const today = new Date();
    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 15)
      .toISOString().split('T')[0];

    const validSwpData = {
      userId: 1,
      schemeCode: 119091,
      transactionType: 'SWP',
      amount: 5000,
      frequency: 'MONTHLY',
      startDate: nextMonthDate
    };

    it('should schedule SWP successfully as PENDING', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(500000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'HDFC Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });
      mockHoldingModel.findByScheme.mockResolvedValueOnce({
        total_units: 100,
        invested_amount: 100000
      });
      mockTransactionModel.create.mockResolvedValueOnce({ id: 1, status: 'PENDING' });

      const result = await demoService.executeTransaction(validSwpData);

      expect(result.transaction).toBeDefined();
      expect(mockTransactionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          transactionType: 'SWP',
          status: 'PENDING'
        })
      );
      // Immediate execution should NOT happen for SWP
      expect(mockDemoAccountModel.updateBalance).not.toHaveBeenCalled();
    });

    it('should reject SWP if start date is not from next month', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(500000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'HDFC Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });
      mockHoldingModel.findByScheme.mockResolvedValueOnce({ total_units: 100 });

      await expect(
        demoService.executeTransaction({
          ...validSwpData,
          startDate: today.toISOString().split('T')[0]
        })
      ).rejects.toThrow(/next month onwards/);
    });

    it('should reject SWP with insufficient units', async () => {
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(500000);
      mockLocalFundService.getSchemeDetails.mockResolvedValueOnce({
        meta: { scheme_name: 'HDFC Fund' },
        latestNav: { nav: '1000.00', date: '2026-01-14' }
      });
      mockHoldingModel.findByScheme.mockResolvedValueOnce({
        total_units: 2 // Only 2 units
      });

      await expect(
        demoService.executeTransaction({
          ...validSwpData,
          amount: 5000 // Needs 5 units
        })
      ).rejects.toThrow('Insufficient units');
    });
  });

  describe('getPortfolio', () => {
    it('should calculate portfolio summary correctly', async () => {
      const holdings = [
        {
          scheme_code: 1,
          total_units: 10,
          invested_amount: 10000,
          current_value: 10000
        }
      ];
      mockHoldingModel.findByUserId.mockResolvedValueOnce(holdings);
      mockDemoAccountModel.getBalance.mockResolvedValueOnce(50000);
      mockLocalFundService.getLatestNAV.mockResolvedValueOnce({ nav: '1100', date: '2026-01-14' });
      mockLocalFundService.getFundWithNav.mockResolvedValueOnce({ scheme_category: 'Equity' });

      const result = await demoService.getPortfolio(1);

      expect(result.summary.totalInvested).toBe(10000);
      expect(result.summary.totalCurrent).toBe(11000);
      expect(result.summary.totalReturns).toBe(1000);
      expect(result.holdings[0].last_nav).toBe(1100);
    });
  });

  describe('getSystematicPlans', () => {
    it('should retrieve active plans', async () => {
      const mockPlans = [{ id: 1, transaction_type: 'SIP' }];
      mockTransactionModel.findActiveSystematicPlans.mockResolvedValueOnce(mockPlans);

      const result = await demoService.getSystematicPlans(1);

      expect(result).toEqual(mockPlans);
      expect(mockTransactionModel.findActiveSystematicPlans).toHaveBeenCalledWith(1);
    });
  });
});
