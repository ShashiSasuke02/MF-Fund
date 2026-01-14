/**
 * Calculator Routes
 * API endpoints for investment calculator operations
 */

import express from 'express';
import calculatorController from '../controllers/calculator.controller.js';

const router = express.Router();

/**
 * GET /api/calculator/rates
 * Get current interest rates for all schemes
 */
router.get('/rates', calculatorController.getInterestRates);

/**
 * Banking Scheme Calculator Routes
 */

// POST /api/calculator/simple-interest
router.post('/simple-interest', calculatorController.calculateSimpleInterest);

// POST /api/calculator/compound-interest
router.post('/compound-interest', calculatorController.calculateCompoundInterest);

// POST /api/calculator/loan-basic
router.post('/loan-basic', calculatorController.calculateBasicLoanEMI);

// POST /api/calculator/loan-advanced
router.post('/loan-advanced', calculatorController.calculateAdvancedLoan);

// POST /api/calculator/fd-payout
router.post('/fd-payout', calculatorController.calculateFDInterestPayout);

// POST /api/calculator/fd-cumulative
router.post('/fd-cumulative', calculatorController.calculateFDCumulative);

// POST /api/calculator/rd
router.post('/rd', calculatorController.calculateRD);

// POST /api/calculator/ppf
router.post('/ppf', calculatorController.calculatePPF);

// POST /api/calculator/ssa
router.post('/ssa', calculatorController.calculateSSA);

// POST /api/calculator/scss
router.post('/scss', calculatorController.calculateSCSS);

/**
 * Post Office Scheme Calculator Routes
 */

// POST /api/calculator/po-mis
router.post('/po-mis', calculatorController.calculatePOMIS);

// POST /api/calculator/po-rd
router.post('/po-rd', calculatorController.calculatePORD);

// POST /api/calculator/po-td
router.post('/po-td', calculatorController.calculatePOTD);

// POST /api/calculator/nsc
router.post('/nsc', calculatorController.calculateNSC);

/**
 * Mutual Fund Calculator Routes
 */

// POST /api/calculator/sip
router.post('/sip', calculatorController.calculateSIP);

// POST /api/calculator/swp
router.post('/swp', calculatorController.calculateSWP);

// POST /api/calculator/stp
router.post('/stp', calculatorController.calculateSTP);

/**
 * Retirement Planning Calculator Routes
 */

// POST /api/calculator/nps
router.post('/nps', calculatorController.calculateNPS);

// POST /api/calculator/epf
router.post('/epf', calculatorController.calculateEPF);

// POST /api/calculator/apy
router.post('/apy', calculatorController.calculateAPY);

export default router;
