/**
 * Calculator Controller
 * Handles HTTP requests for investment calculator operations
 */

import calculatorService from '../services/calculator.service.js';
import interestRateService from '../services/interestRate.service.js';

/**
 * Get current interest rates for all schemes
 */
export const getInterestRates = async (req, res, next) => {
  try {
    const { forceRefresh } = req.query;
    const rates = await interestRateService.getCurrentRates(forceRefresh === 'true');
    
    res.json({
      success: true,
      data: { rates }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Simple Interest
 */
export const calculateSimpleInterest = async (req, res, next) => {
  try {
    const { principal, rate, time } = req.body;
    
    const result = calculatorService.calculateSimpleInterest(
      parseFloat(principal),
      parseFloat(rate),
      parseFloat(time)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Compound Interest
 */
export const calculateCompoundInterest = async (req, res, next) => {
  try {
    const { principal, rate, time, frequency } = req.body;
    
    const result = calculatorService.calculateCompoundInterest(
      parseFloat(principal),
      parseFloat(rate),
      parseFloat(time),
      frequency ? parseInt(frequency) : 1
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Basic Loan EMI
 */
export const calculateBasicLoanEMI = async (req, res, next) => {
  try {
    const { principal, rate, tenureMonths } = req.body;
    
    const result = calculatorService.calculateBasicLoanEMI(
      parseFloat(principal),
      parseFloat(rate),
      parseInt(tenureMonths)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Advanced Loan with Prepayment
 */
export const calculateAdvancedLoan = async (req, res, next) => {
  try {
    const { principal, rate, tenureMonths, prepayments } = req.body;
    
    const result = calculatorService.calculateAdvancedLoan(
      parseFloat(principal),
      parseFloat(rate),
      parseInt(tenureMonths),
      prepayments || []
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Fixed Deposit with Interest Payout
 */
export const calculateFDInterestPayout = async (req, res, next) => {
  try {
    const { principal, rate, tenureMonths, payoutFrequency } = req.body;
    
    const result = calculatorService.calculateFDInterestPayout(
      parseFloat(principal),
      parseFloat(rate),
      parseInt(tenureMonths),
      payoutFrequency || 'monthly'
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Fixed Deposit Cumulative
 */
export const calculateFDCumulative = async (req, res, next) => {
  try {
    const { principal, rate, tenureMonths, compoundingFrequency } = req.body;
    
    const result = calculatorService.calculateFDCumulative(
      parseFloat(principal),
      parseFloat(rate),
      parseInt(tenureMonths),
      compoundingFrequency ? parseInt(compoundingFrequency) : 4
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Recurring Deposit
 */
export const calculateRD = async (req, res, next) => {
  try {
    const { monthlyDeposit, rate, tenureMonths } = req.body;
    
    const result = calculatorService.calculateRD(
      parseFloat(monthlyDeposit),
      parseFloat(rate),
      parseInt(tenureMonths)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Public Provident Fund (PPF)
 */
export const calculatePPF = async (req, res, next) => {
  try {
    const { annualDeposit, rate, tenureYears } = req.body;
    
    const result = calculatorService.calculatePPF(
      parseFloat(annualDeposit),
      parseFloat(rate),
      tenureYears ? parseInt(tenureYears) : 15
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Sukanya Samriddhi Account (SSA)
 */
export const calculateSSA = async (req, res, next) => {
  try {
    const { annualDeposit, rate, depositYears } = req.body;
    
    const result = calculatorService.calculateSSA(
      parseFloat(annualDeposit),
      parseFloat(rate),
      depositYears ? parseInt(depositYears) : 15
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Senior Citizen Savings Scheme (SCSS)
 */
export const calculateSCSS = async (req, res, next) => {
  try {
    const { principal, rate } = req.body;
    
    const result = calculatorService.calculateSCSS(
      parseFloat(principal),
      parseFloat(rate)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Post Office Monthly Income Scheme (MIS)
 */
export const calculatePOMIS = async (req, res, next) => {
  try {
    const { principal, rate } = req.body;
    
    const result = calculatorService.calculatePOMIS(
      parseFloat(principal),
      parseFloat(rate)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Post Office Recurring Deposit (RD)
 */
export const calculatePORD = async (req, res, next) => {
  try {
    const { monthlyDeposit, rate, tenureMonths } = req.body;
    
    const result = calculatorService.calculatePORD(
      parseFloat(monthlyDeposit),
      parseFloat(rate),
      tenureMonths ? parseInt(tenureMonths) : 60
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Post Office Time Deposit (TD)
 */
export const calculatePOTD = async (req, res, next) => {
  try {
    const { principal, rate, tenureYears } = req.body;
    
    const result = calculatorService.calculatePOTD(
      parseFloat(principal),
      parseFloat(rate),
      parseInt(tenureYears)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate National Savings Certificate (NSC)
 */
export const calculateNSC = async (req, res, next) => {
  try {
    const { principal, rate } = req.body;
    
    const result = calculatorService.calculateNSC(
      parseFloat(principal),
      parseFloat(rate)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Systematic Investment Plan (SIP)
 */
export const calculateSIP = async (req, res, next) => {
  try {
    const { monthlyInvestment, expectedReturn, tenureYears } = req.body;
    
    const result = calculatorService.calculateSIP(
      parseFloat(monthlyInvestment),
      parseFloat(expectedReturn),
      parseFloat(tenureYears)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Systematic Withdrawal Plan (SWP)
 */
export const calculateSWP = async (req, res, next) => {
  try {
    const { initialInvestment, monthlyWithdrawal, expectedReturn, tenureYears } = req.body;
    
    const result = calculatorService.calculateSWP(
      parseFloat(initialInvestment),
      parseFloat(monthlyWithdrawal),
      parseFloat(expectedReturn),
      parseFloat(tenureYears)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Systematic Transfer Plan (STP)
 */
export const calculateSTP = async (req, res, next) => {
  try {
    const { initialInvestment, monthlyTransfer, sourceFundReturn, targetFundReturn, tenureYears } = req.body;
    
    const result = calculatorService.calculateSTP(
      parseFloat(initialInvestment),
      parseFloat(monthlyTransfer),
      parseFloat(sourceFundReturn),
      parseFloat(targetFundReturn),
      parseFloat(tenureYears)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate National Pension System (NPS)
 */
export const calculateNPS = async (req, res, next) => {
  try {
    const { monthlyContribution, currentAge, retirementAge, expectedReturn } = req.body;
    
    const result = calculatorService.calculateNPS(
      parseFloat(monthlyContribution),
      parseInt(currentAge),
      retirementAge ? parseInt(retirementAge) : 60,
      parseFloat(expectedReturn)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Employees' Provident Fund (EPF)
 */
export const calculateEPF = async (req, res, next) => {
  try {
    const { 
      basicSalary, 
      employeeContribution, 
      employerContribution, 
      currentAge, 
      retirementAge, 
      annualIncrement, 
      interestRate 
    } = req.body;
    
    const result = calculatorService.calculateEPF(
      parseFloat(basicSalary),
      employeeContribution ? parseFloat(employeeContribution) : 12,
      employerContribution ? parseFloat(employerContribution) : 12,
      parseInt(currentAge),
      retirementAge ? parseInt(retirementAge) : 58,
      annualIncrement ? parseFloat(annualIncrement) : 5,
      parseFloat(interestRate)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate Atal Pension Yojana (APY)
 */
export const calculateAPY = async (req, res, next) => {
  try {
    const { currentAge, pensionAmount } = req.body;
    
    const result = calculatorService.calculateAPY(
      parseInt(currentAge),
      parseInt(pensionAmount)
    );
    
    res.json({
      success: true,
      data: { result }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getInterestRates,
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
};
