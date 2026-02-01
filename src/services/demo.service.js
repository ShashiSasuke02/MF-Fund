import { demoAccountModel } from '../models/demoAccount.model.js';
import { transactionModel } from '../models/transaction.model.js';
import { holdingModel } from '../models/holding.model.js';
import { localFundService } from './localFund.service.js';
import logger from './logger.service.js';

/**
 * Demo Service - handles demo account transactions
 * 
 * LOCAL-FIRST ARCHITECTURE: All fund/NAV data is fetched from local database.
 * MFAPI is ONLY accessed by sync jobs.
 */

const isTestEnv = process.env.NODE_ENV === 'test';
const log = (...args) => {
  if (!isTestEnv) logger.info(args.join(' '));
};
const logError = (...args) => {
  if (!isTestEnv) logger.error(args.join(' '));
};

import { toISTDateString, getISTDate } from '../utils/date.utils.js';

// Helper to format date for DB (YYYY-MM-DD)
const formatDateForDB = (date) => {
  if (!date) return null;
  // If it's already a Date object
  if (date instanceof Date) {
    return toISTDateString(date);
  }
  // If string, try to parse
  if (typeof date === 'string') {
    // If it's already short enough, return as is (assuming valid)
    if (date.length <= 10) return date;
    // If ISO string
    if (date.includes('T')) return date.split('T')[0];
    try {
      return toISTDateString(new Date(date));
    } catch (e) {
      return date.substring(0, 10);
    }
  }
  return null;
};

// Helper to calculate next execution date
const calculateNextDate = (currentDate, frequency) => {
  const current = new Date(currentDate);
  let next;

  switch (frequency) {
    case 'DAILY':
      next = new Date(current);
      next.setDate(current.getDate() + 1);
      break;
    case 'WEEKLY':
      next = new Date(current);
      next.setDate(current.getDate() + 7);
      break;
    case 'MONTHLY':
      next = new Date(current);
      next.setMonth(current.getMonth() + 1);
      break;
    case 'QUARTERLY':
      next = new Date(current);
      next.setMonth(current.getMonth() + 3);
      break;
    case 'YEARLY':
      next = new Date(current);
      next.setFullYear(current.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return toISTDateString(next);
};

export const demoService = {
  /**
   * Execute a transaction (SIP, STP, Lump Sum, SWP)
   */
  async executeTransaction({
    userId,
    schemeCode,
    transactionType,
    amount,
    frequency,
    startDate,
    endDate,
    installments
  }) {
    // Get current balance and ensure it's a number
    const currentBalance = parseFloat(await demoAccountModel.getBalance(userId));

    // Ensure numeric values are numbers
    amount = parseFloat(amount);
    schemeCode = parseInt(schemeCode);

    log('[Demo Service] executeTransaction - userId:', userId, 'currentBalance:', currentBalance, 'amount:', amount);

    if (!currentBalance && currentBalance !== 0) {
      throw new Error('Demo account not found');
    }

    // Get fund details from LOCAL DATABASE
    const fundDetails = await localFundService.getSchemeDetails(schemeCode);
    if (!fundDetails || !fundDetails.meta) {
      throw new Error('Fund not found in local database. Please run fund sync.');
    }

    const schemeName = fundDetails.meta.scheme_name;
    const latestNav = parseFloat(fundDetails.latestNav?.nav || 0);

    if (!latestNav) {
      throw new Error('NAV not available for this scheme');
    }

    // Validate transaction based on type
    if (transactionType === 'LUMP_SUM' || transactionType === 'SIP' || transactionType === 'STP') {
      // Validate SIP/STP frequency
      if (transactionType === 'SIP' || transactionType === 'STP') {
        if (!frequency) {
          throw new Error('Frequency is required for SIP/STP transactions');
        }
        const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];
        if (!validFrequencies.includes(frequency)) {
          throw new Error('Invalid frequency. Must be DAILY, WEEKLY, MONTHLY, or QUARTERLY');
        }
      }

      // Purchase transactions - check sufficient balance
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      if (currentBalance < amount) {
        throw new Error('Insufficient demo balance');
      }

      // Calculate units
      const units = amount / latestNav;

      // Determine transaction status and next execution date based on start date
      let transactionStatus = 'SUCCESS';
      let nextExecutionDate = null;
      let initialUnits = units;
      let initialNav = latestNav;

      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      // For SIP/STP logic
      if (transactionType === 'SIP' || transactionType === 'STP') {
        const istToday = getISTDate(); // Use IST Today string "YYYY-MM-DD"

        // Check start date if provided
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);

          if (start > today) {
            // Future SIP
            transactionStatus = 'PENDING';
            nextExecutionDate = startDate; // Set next execution to start date
            // Future SIP Zero-Allocation: Do not allocate units/NAV yet
            initialUnits = null;
            initialNav = null;
            log('[Demo Service] Future SIP detected. Setting units/NAV to null until execution.');
          } else {
            // Immediate SIP (today or past date): Execute now, schedule next
            nextExecutionDate = calculateNextDate(istToday, frequency);
            log('[Demo Service] Immediate SIP. Next execution scheduled for:', nextExecutionDate);
          }
        } else {
          // No start date provided (defaults to immediate): Execute now, schedule next
          nextExecutionDate = calculateNextDate(istToday, frequency);
          log('[Demo Service] Immediate SIP (No Date). Next execution scheduled for:', nextExecutionDate);
        }

        // CRITICAL FIX: If executing immediately, mark as done for today to prevent double execution
        if (transactionStatus === 'SUCCESS') {
          // We are effectively running the first installment now
        }
      }

      // Create transaction record
      const transaction = await transactionModel.create({
        userId,
        schemeCode,
        schemeName,
        transactionType,
        amount,
        units: initialUnits,
        nav: initialNav,
        frequency: transactionType === 'LUMP_SUM' ? null : frequency,
        startDate: transactionType === 'LUMP_SUM' ? null : startDate,
        endDate: transactionType === 'LUMP_SUM' ? null : endDate,
        installments: transactionType === 'LUMP_SUM' ? null : installments,
        status: transactionStatus,
        nextExecutionDate: nextExecutionDate,
        // CRITICAL FIX: Set lastExecutionDate and executionCount if immediate
        lastExecutionDate: transactionStatus === 'SUCCESS' ? getISTDate() : null,
        executionCount: transactionStatus === 'SUCCESS' ? 1 : 0
      });

      // Update demo balance only if transaction is executed immediately (not pending)
      let newBalance = currentBalance;
      if (transactionStatus === 'SUCCESS') {
        newBalance = currentBalance - amount;
        log('[Demo Service] Updating balance - old:', currentBalance, 'new:', newBalance, 'deducted:', amount);
        await demoAccountModel.updateBalance(userId, newBalance);
      } else {
        log('[Demo Service] Transaction pending - balance not updated yet');
      }



      // ... existing code ...

      // Update or create holding only if transaction is executed immediately (not pending)
      if (transactionStatus === 'SUCCESS') {
        const existingHolding = await holdingModel.findByScheme(userId, schemeCode);

        if (existingHolding) {
          await holdingModel.upsert({
            userId,
            schemeCode,
            schemeName,
            units: existingHolding.total_units + units,
            investedAmount: existingHolding.invested_amount + amount,
            currentValue: (existingHolding.total_units + units) * latestNav,
            lastNav: latestNav,
            lastNavDate: formatDateForDB(fundDetails.latestNav?.date)
          });
        } else {
          await holdingModel.upsert({
            userId,
            schemeCode,
            schemeName,
            units,
            investedAmount: amount,
            currentValue: units * latestNav,
            lastNav: latestNav,
            lastNavDate: formatDateForDB(fundDetails.latestNav?.date)
          });
        }
      } else {
        log('[Demo Service] Transaction pending - holdings not updated yet');
      }

      return {
        transaction,
        newBalance,
        holding: transactionStatus === 'SUCCESS' ? await holdingModel.findByScheme(userId, schemeCode) : null
      };
    } else if (transactionType === 'SWP') {
      // Withdrawal transaction - check sufficient units
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const holding = await holdingModel.findByScheme(userId, schemeCode);
      if (!holding) {
        throw new Error('No holdings found for this scheme');
      }

      const requiredUnits = amount / latestNav;
      if (holding.total_units < requiredUnits) {
        throw new Error('Insufficient units for withdrawal');
      }

      // SWP Constraints: Frequency must be WEEKLY, MONTHLY or QUARTERLY
      if (frequency !== 'WEEKLY' && frequency !== 'MONTHLY' && frequency !== 'QUARTERLY') {
        throw new Error('SWP frequency must be WEEKLY, MONTHLY or QUARTERLY');
      }

      // SWP Constraints: Start Date must be Next Month or later
      if (!startDate) {
        throw new Error('Start date is required for SWP');
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);

      // Calculate tomorrow for validation
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      // Relaxed constraint: Start Date must be in the future (tomorrow onwards)
      if (start < tomorrow) {
        throw new Error('SWP start date must be a future date (from tomorrow onwards)');
      }

      // Status is ALWAYS PENDING for SWP as immediate execution is disabled
      const transactionStatus = 'PENDING';

      // Future SWP Logic: Defer calculation until execution date
      let initialUnits = -requiredUnits;
      let initialNav = latestNav;

      const swpStart = new Date(startDate);
      swpStart.setHours(0, 0, 0, 0);

      if (swpStart > today) {
        log('[Demo Service] Future SWP detected. Setting units/NAV to null until execution.');
        initialUnits = null;
        initialNav = null;
      }

      // Create transaction record
      const transaction = await transactionModel.create({
        userId,
        schemeCode,
        schemeName,
        transactionType,
        amount,
        units: initialUnits, // Null for future, calculated at execution
        nav: initialNav,
        frequency,
        startDate,
        endDate,
        installments,
        status: transactionStatus,
        nextExecutionDate: startDate // Schedule for the specific start date
      });

      // No immediate balance/holding update needed for PENDING
      log('[Demo Service] SWP scheduled - pending execution on ' + startDate);

      return {
        transaction,
        newBalance: currentBalance, // Balance unchanged
        holding // Holding unchanged
      };
    } else {
      throw new Error('Invalid transaction type');
    }
  },

  /**
   * Get portfolio summary
   */
  async getPortfolio(userId) {
    log('[Demo Service] getPortfolio - userId:', userId);
    const holdings = await holdingModel.findByUserId(userId);
    log('[Demo Service] Retrieved', holdings.length, 'holdings for userId:', userId);
    const balance = await demoAccountModel.getBalance(userId);

    let navUnavailable = false;
    let lastSuccessfulUpdate = null;

    // Update current values with latest NAV
    const updatedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        // Convert string values to numbers
        const totalUnits = parseFloat(holding.total_units);
        const investedAmount = parseFloat(holding.invested_amount);
        const currentValueFromDb = parseFloat(holding.current_value || 0);

        try {
          // Fetch latest NAV from LOCAL DATABASE
          const latestData = await localFundService.getLatestNAV(holding.scheme_code);
          if (latestData && latestData.nav) {
            const latestNav = parseFloat(latestData.nav);
            const currentValue = totalUnits * latestNav;

            // Get scheme category from fund details
            const fundInfo = await localFundService.getFundWithNav(holding.scheme_code);
            const schemeCategory = fundInfo?.scheme_category || null;

            // Track last successful NAV date
            if (!lastSuccessfulUpdate || latestData.date > lastSuccessfulUpdate) {
              lastSuccessfulUpdate = latestData.date;
            }

            await holdingModel.updateCurrentValue(
              userId,
              holding.scheme_code,
              latestNav,
              formatDateForDB(latestData.date)
            );

            // Calculate invested NAV (average purchase price per unit)
            const investedNav = totalUnits > 0 ? investedAmount / totalUnits : 0;

            return {
              ...holding,
              scheme_category: schemeCategory,
              total_units: totalUnits,
              invested_amount: investedAmount,
              invested_nav: investedNav,
              created_at: holding.created_at,
              last_nav: latestNav,
              last_nav_date: latestData.date,
              current_value: currentValue,
              returns: currentValue - investedAmount,
              returns_percentage: ((currentValue - investedAmount) / investedAmount) * 100
            };
          }
        } catch (error) {
          logError(`Failed to update NAV for scheme ${holding.scheme_code}:`, error.message);
          navUnavailable = true;

          // Use last known NAV date from database
          if (holding.last_nav_date && (!lastSuccessfulUpdate || holding.last_nav_date > lastSuccessfulUpdate)) {
            lastSuccessfulUpdate = holding.last_nav_date;
          }
        }

        // Calculate invested NAV (average purchase price per unit)
        const investedNav = totalUnits > 0 ? investedAmount / totalUnits : 0;

        // Recalculate current value using last known NAV even in error cases
        const lastKnownNav = parseFloat(holding.last_nav || 0);
        const recalculatedCurrentValue = totalUnits * lastKnownNav;

        return {
          ...holding,
          scheme_category: null,  // Add null scheme_category for error cases
          total_units: totalUnits,
          invested_amount: investedAmount,
          invested_nav: investedNav,
          created_at: holding.created_at,
          current_value: recalculatedCurrentValue,
          returns: recalculatedCurrentValue - investedAmount,
          returns_percentage: investedAmount > 0
            ? ((recalculatedCurrentValue - investedAmount) / investedAmount) * 100
            : 0
        };
      })
    );

    const totalInvested = updatedHoldings.reduce((sum, h) => sum + parseFloat(h.invested_amount || 0), 0);
    const totalCurrent = updatedHoldings.reduce((sum, h) => sum + parseFloat(h.current_value || 0), 0);
    const totalReturns = totalCurrent - totalInvested;

    return {
      balance,
      holdings: updatedHoldings,
      summary: {
        totalInvested,
        totalCurrent,
        totalReturns,
        returnsPercentage: totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0
      },
      navStatus: {
        unavailable: navUnavailable,
        lastUpdate: lastSuccessfulUpdate
      }
    };
  },

  /**
   * Get transaction history
   */
  async getTransactions(userId, limit = 50, offset = 0) {
    log('[Demo Service] getTransactions - userId:', userId, 'limit:', limit, 'offset:', offset);
    const transactions = await transactionModel.findByUserId(userId, limit, offset);
    log('[Demo Service] Retrieved', transactions.length, 'transactions for userId:', userId);
    return transactions;
  },

  /**
   * Get active systematic plans (SIP, STP, SWP)
   */
  async getSystematicPlans(userId) {
    log('[Demo Service] getSystematicPlans - userId:', userId);
    const plans = await transactionModel.findActiveSystematicPlans(userId);
    log('[Demo Service] Retrieved', plans.length, 'systematic plans for userId:', userId);
    return plans;
  }
};
