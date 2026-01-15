/**
 * Calculator Service Unit Tests
 * Comprehensive tests for all investment calculator functions
 */

import {
  calculateSimpleInterest,
  calculateCompoundInterest,
  calculateBasicLoanEMI,
  calculateAdvancedLoan,
  calculateFDInterestPayout,
  calculateFDCumulative,
  calculateRD,
  calculatePPF,
  calculateSSA,
  calculateSCSS,
  calculatePOMIS,
  calculatePORD,
  calculatePOTD,
  calculateNSC,
  calculateSIP,
  calculateSWP,
  calculateSTP,
  calculateNPS,
  calculateEPF,
  calculateAPY
} from '../../../src/services/calculator.service.js';

describe('Banking Scheme Calculators', () => {
  describe('calculateSimpleInterest', () => {
    test('should calculate simple interest correctly', () => {
      const result = calculateSimpleInterest(100000, 7.5, 5);
      expect(result.interest).toBe(37500);
      expect(result.totalAmount).toBe(137500);
    });

    test('should handle zero interest rate', () => {
      const result = calculateSimpleInterest(100000, 0, 5);
      expect(result.interest).toBe(0);
      expect(result.totalAmount).toBe(100000);
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateSimpleInterest(-100, 5, 2)).toThrow();
      expect(() => calculateSimpleInterest(100, -5, 2)).toThrow();
      expect(() => calculateSimpleInterest(100, 5, 0)).toThrow();
    });
  });

  describe('calculateCompoundInterest', () => {
    test('should calculate compound interest with quarterly compounding', () => {
      const result = calculateCompoundInterest(100000, 7.5, 5, 4);
      expect(result.interest).toBeCloseTo(44994.80, 1);
      expect(result.totalAmount).toBeCloseTo(144994.80, 1);
    });

    test('should calculate compound interest with monthly compounding', () => {
      const result = calculateCompoundInterest(100000, 7.5, 5, 12);
      expect(result.interest).toBeCloseTo(45329.44, 1);
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateCompoundInterest(-100, 5, 2, 4)).toThrow();
      expect(() => calculateCompoundInterest(100, 5, 2, 0)).toThrow();
    });
  });

  describe('calculateBasicLoanEMI', () => {
    test('should calculate EMI correctly for home loan', () => {
      const result = calculateBasicLoanEMI(5000000, 8.5, 240); // 50L for 20 years
      expect(result.emi).toBeCloseTo(43391.20, 0);
      expect(result.totalInterest).toBeCloseTo(5413878.80, 0);
    });

    test('should handle zero interest rate', () => {
      const result = calculateBasicLoanEMI(120000, 0, 12);
      expect(result.emi).toBe(10000);
      expect(result.totalInterest).toBe(0);
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateBasicLoanEMI(-100000, 8.5, 240)).toThrow();
      expect(() => calculateBasicLoanEMI(100000, -1, 240)).toThrow();
    });
  });

  describe('calculateAdvancedLoan', () => {
    test('should calculate loan with prepayment', () => {
      const prepayments = [
        { month: 12, amount: 50000 },
        { month: 24, amount: 50000 }
      ];
      const result = calculateAdvancedLoan(500000, 8.5, 60, prepayments);
      
      expect(result.actualTenure).toBeLessThan(result.originalTenure);
      expect(result.savingsFromPrepayment).toBeGreaterThan(0);
      expect(result.schedule).toBeDefined();
      expect(result.schedule[0].month).toBe(1);
    });

    test('should calculate loan without prepayment', () => {
      const result = calculateAdvancedLoan(500000, 8.5, 60, []);
      expect(result.actualTenure).toBe(60);
      expect(result.schedule.length).toBe(60);
    });
  });

  describe('calculateFDInterestPayout', () => {
    test('should calculate monthly payout correctly', () => {
      const result = calculateFDInterestPayout(1000000, 7.5, 12, 'monthly');
      expect(result.interestPerPayout).toBeCloseTo(6250, 0);
      expect(result.numberOfPayouts).toBe(12);
    });

    test('should calculate quarterly payout correctly', () => {
      const result = calculateFDInterestPayout(1000000, 7.5, 12, 'quarterly');
      expect(result.interestPerPayout).toBeCloseTo(18750, 0);
      expect(result.numberOfPayouts).toBe(4);
    });

    test('should throw error for invalid frequency', () => {
      expect(() => calculateFDInterestPayout(100000, 7.5, 12, 'invalid')).toThrow();
    });
  });

  describe('calculateFDCumulative', () => {
    test('should calculate cumulative FD correctly', () => {
      const result = calculateFDCumulative(1000000, 7.5, 60, 4); // 5 years quarterly
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeGreaterThan(1000000);
    });
  });

  describe('calculateRD', () => {
    test('should calculate RD maturity correctly', () => {
      const result = calculateRD(5000, 6.5, 60); // 5 years
      expect(result.totalDeposit).toBe(300000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeGreaterThan(300000);
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateRD(-5000, 6.5, 60)).toThrow();
      expect(() => calculateRD(5000, -6.5, 60)).toThrow();
    });
  });

  describe('calculatePPF', () => {
    test('should calculate PPF for 15 years', () => {
      const result = calculatePPF(150000, 7.1, 15);
      expect(result.totalDeposit).toBe(2250000);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeGreaterThan(2250000);
      expect(result.yearlyBreakdown.length).toBe(15);
    });

    test('should throw error for invalid deposit amount', () => {
      expect(() => calculatePPF(100, 7.1, 15)).toThrow('between ₹500 and ₹1,50,000');
      expect(() => calculatePPF(200000, 7.1, 15)).toThrow('between ₹500 and ₹1,50,000');
    });

    test('should throw error for tenure less than 15 years', () => {
      expect(() => calculatePPF(50000, 7.1, 10)).toThrow('at least 15 years');
    });
  });

  describe('calculateSSA', () => {
    test('should calculate SSA for 21 years maturity', () => {
      const result = calculateSSA(150000, 8.2, 15);
      expect(result.maturityYears).toBe(21);
      expect(result.depositYears).toBe(15);
      expect(result.totalDeposit).toBe(2250000);
      expect(result.yearlyBreakdown.length).toBe(21);
    });

    test('should throw error for invalid deposit amount', () => {
      expect(() => calculateSSA(100, 8.2, 15)).toThrow('between ₹250 and ₹1,50,000');
      expect(() => calculateSSA(200000, 8.2, 15)).toThrow('between ₹250 and ₹1,50,000');
    });

    test('should throw error for invalid deposit years', () => {
      expect(() => calculateSSA(50000, 8.2, 20)).toThrow('between 1 and 15');
    });
  });

  describe('calculateSCSS', () => {
    test('should calculate SCSS correctly', () => {
      const result = calculateSCSS(1500000, 8.2);
      expect(result.tenureYears).toBe(5);
      expect(result.totalQuarters).toBe(20);
      expect(result.quarterlyInterest).toBeCloseTo(30750, 0);
      expect(result.totalInterest).toBeCloseTo(615000, 0);
    });

    test('should throw error for invalid principal', () => {
      expect(() => calculateSCSS(500, 8.2)).toThrow('between ₹1,000 and ₹30,00,000');
      expect(() => calculateSCSS(5000000, 8.2)).toThrow('between ₹1,000 and ₹30,00,000');
    });
  });
});

describe('Post Office Scheme Calculators', () => {
  describe('calculatePOMIS', () => {
    test('should calculate Post Office MIS correctly', () => {
      const result = calculatePOMIS(450000, 7.4);
      expect(result.tenureYears).toBe(5);
      expect(result.monthlyIncome).toBeCloseTo(2775, 0);
      expect(result.totalMonths).toBe(60);
      expect(result.maturityAmount).toBe(450000); // Principal returned
    });

    test('should throw error for invalid principal', () => {
      expect(() => calculatePOMIS(500, 7.4)).toThrow('between ₹1,000 and ₹9,00,000');
      expect(() => calculatePOMIS(1000000, 7.4)).toThrow('between ₹1,000 and ₹9,00,000');
    });
  });

  describe('calculatePOTD', () => {
    test('should calculate 5-year Post Office TD', () => {
      const result = calculatePOTD(100000, 7.5, 5);
      expect(result.tenureYears).toBe(5);
      expect(result.compoundingFrequency).toBe(4);
      expect(result.maturityAmount).toBeGreaterThan(100000);
    });

    test('should throw error for invalid tenure', () => {
      expect(() => calculatePOTD(100000, 7.5, 4)).toThrow('must be 1, 2, 3, or 5 years');
    });
  });

  describe('calculateNSC', () => {
    test('should calculate NSC for 5 years', () => {
      const result = calculateNSC(100000, 7.7);
      expect(result.tenureYears).toBe(5);
      expect(result.totalInterest).toBeGreaterThan(0);
      expect(result.maturityAmount).toBeCloseTo(144903.38, 0);
    });
  });
});

describe('Mutual Fund Calculators', () => {
  describe('calculateSIP', () => {
    test('should calculate SIP returns correctly', () => {
      const result = calculateSIP(5000, 12, 10);
      expect(result.totalInvestment).toBe(600000);
      expect(result.totalMonths).toBe(120);
      expect(result.futureValue).toBeGreaterThan(600000);
      expect(result.totalReturns).toBeGreaterThan(0);
    });

    test('should handle high returns', () => {
      const result = calculateSIP(10000, 15, 20);
      expect(result.futureValue).toBeGreaterThan(10000000); // > 1 crore
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateSIP(-5000, 12, 10)).toThrow();
      expect(() => calculateSIP(5000, -12, 10)).toThrow();
    });
  });

  describe('calculateSWP', () => {
    test('should calculate SWP correctly', () => {
      const result = calculateSWP(1000000, 10000, 8, 10);
      expect(result.totalWithdrawn).toBe(1200000); // 10k * 120 months
      expect(result.monthlyBreakdown).toBeDefined();
    });

    test('should handle high withdrawal amounts', () => {
      const result = calculateSWP(1000000, 50000, 8, 5);
      // Should deplete faster
      expect(result.remainingBalance).toBeDefined();
    });
  });

  describe('calculateSTP', () => {
    test('should calculate STP correctly', () => {
      const result = calculateSTP(1000000, 50000, 6, 12, 5);
      expect(result.totalTransferred).toBeGreaterThan(0);
      expect(result.sourceBalance).toBeGreaterThanOrEqual(0);
      expect(result.targetBalance).toBeGreaterThan(0);
      expect(result.totalValue).toBeGreaterThan(0);
    });
  });
});

describe('Retirement Planning Calculators', () => {
  describe('calculateNPS', () => {
    test('should calculate NPS corpus correctly', () => {
      const result = calculateNPS(5000, 30, 60, 10);
      expect(result.tenureYears).toBe(30);
      expect(result.retirementCorpus).toBeGreaterThan(1000000);
      expect(result.lumpSumWithdrawal).toBeCloseTo(result.retirementCorpus * 0.6, 2);
      expect(result.annuityAmount).toBeCloseTo(result.retirementCorpus * 0.4, 2);
      expect(result.estimatedMonthlyPension).toBeGreaterThan(0);
    });

    test('should throw error for invalid age', () => {
      expect(() => calculateNPS(5000, 65, 60, 10)).toThrow('Check age');
    });
  });

  describe('calculateEPF', () => {
    test('should calculate EPF corpus with salary increments', () => {
      const result = calculateEPF(30000, 12, 12, 25, 58, 5, 8.25);
      expect(result.tenureYears).toBe(33);
      expect(result.retirementCorpus).toBeGreaterThan(5000000);
      expect(result.totalEmployeeContribution).toBeGreaterThan(0);
      expect(result.totalEmployerContribution).toBeGreaterThan(0);
    });

    test('should throw error for invalid inputs', () => {
      expect(() => calculateEPF(-30000, 12, 12, 25, 58, 5, 8.25)).toThrow();
    });
  });

  describe('calculateAPY', () => {
    test('should calculate APY for ₹5000 pension', () => {
      const result = calculateAPY(30, 5000);
      expect(result.pensionAmount).toBe(5000);
      expect(result.monthlyContribution).toBeGreaterThan(0);
      expect(result.contributionYears).toBe(30);
    });

    test('should throw error for invalid age', () => {
      expect(() => calculateAPY(17, 5000)).toThrow('between 18 and 40');
      expect(() => calculateAPY(45, 5000)).toThrow('between 18 and 40');
    });

    test('should throw error for invalid pension amount', () => {
      expect(() => calculateAPY(30, 1500)).toThrow('must be ₹1000, ₹2000');
    });
  });
});

describe('Edge Cases and Performance', () => {
  test('all calculations should complete within 100ms', () => {
    const start = Date.now();
    
    calculateSimpleInterest(100000, 7.5, 5);
    calculateCompoundInterest(100000, 7.5, 5, 4);
    calculateBasicLoanEMI(500000, 8.5, 60);
    calculateSIP(5000, 12, 10);
    calculatePPF(150000, 7.1, 15);
    
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100);
  });

  test('should handle large numbers correctly', () => {
    const result = calculateSIP(100000, 15, 30);
    expect(result.futureValue).toBeGreaterThan(100000000); // > 10 crores
    expect(Number.isFinite(result.futureValue)).toBe(true);
  });

  test('should round results to 2 decimal places', () => {
    const result = calculateSimpleInterest(100000, 7.5, 5);
    expect(result.interest.toString().split('.')[1]?.length || 0).toBeLessThanOrEqual(2);
  });
});
