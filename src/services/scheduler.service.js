import { transactionModel } from '../models/transaction.model.js';
import { executionLogModel } from '../models/executionLog.model.js';
import { demoAccountModel } from '../models/demoAccount.model.js';
import { holdingModel } from '../models/holding.model.js';
import { notificationModel } from '../models/notification.model.js';
import { localFundService } from './localFund.service.js';

/**
 * Scheduler Service
 * Handles automated execution of PENDING SIP/STP/SWP transactions
 * 
 * LOCAL-FIRST ARCHITECTURE: Uses local DB NAV data for transaction execution.
 * MFAPI is ONLY accessed by sync jobs.
 */
export const schedulerService = {
  /**
   * Execute all due transactions for a given date
   * @param {string} targetDate - Date in YYYY-MM-DD format (default: today)
   * @returns {object} Execution summary
   */
  async executeDueTransactions(targetDate = null) {
    const startTime = Date.now();

    // Default to today if no target date provided
    if (!targetDate) {
      const today = new Date();
      targetDate = today.toISOString().split('T')[0];
    }

    console.log(`[Scheduler] Starting execution for date: ${targetDate}`);

    // Release any stale locks first
    await transactionModel.releaseStaleAccess();

    // Fetch due transactions
    const dueTransactions = await transactionModel.findDueTransactions(targetDate);

    if (dueTransactions.length === 0) {
      console.log('[Scheduler] No due transactions found');
      return {
        targetDate,
        totalDue: 0,
        executed: 0,
        failed: 0,
        skipped: 0,
        details: [],
        durationMs: Date.now() - startTime
      };
    }

    console.log(`[Scheduler] Found ${dueTransactions.length} due transactions`);

    const results = {
      targetDate,
      totalDue: dueTransactions.length,
      executed: 0,
      failed: 0,
      skipped: 0,
      details: [],
      durationMs: 0
    };

    // Process each transaction
    for (const transaction of dueTransactions) {
      const execResult = await this.executeScheduledTransaction(transaction, targetDate);

      if (execResult.status === 'SUCCESS') {
        results.executed++;
      } else if (execResult.status === 'FAILED') {
        results.failed++;
      } else if (execResult.status === 'SKIPPED') {
        results.skipped++;
      }

      results.details.push(execResult);
    }

    results.durationMs = Date.now() - startTime;
    results.totalInvested = 0;
    results.totalWithdrawn = 0;

    // Calculate Financials
    for (const detail of results.details) {
      if (detail.status === 'SUCCESS') {
        const txn = dueTransactions.find(t => t.id === detail.transactionId);

        // Log if txn not found (should not happen normally)
        if (!txn) {
          console.warn(`[Scheduler] Warning: Transaction ${detail.transactionId} not found in due list during stats calculation.`);
          continue;
        }

        const amt = parseFloat(txn.amount) || 0;
        const type = (txn.transaction_type || '').toUpperCase();

        if (type === 'SIP') {
          results.totalInvested += amt;
        } else if (type === 'SWP') {
          results.totalWithdrawn += amt;
        }
      }
    }

    console.log(`[Scheduler] Execution complete:`, {
      executed: results.executed,
      failed: results.failed,
      skipped: results.skipped,
      invested: results.totalInvested,
      withdrawn: results.totalWithdrawn,
      totalDurationMs: results.durationMs
    });

    return results;
  },

  /**
   * Execute a single scheduled transaction
   * @param {object} transaction - Transaction to execute
   * @param {string} executionDate - Date of execution (YYYY-MM-DD)
   * @returns {object} Execution result
   */
  async executeScheduledTransaction(transaction, executionDate) {
    const startTime = Date.now();
    let logData = {
      transactionId: transaction.id,
      executionDate,
      status: 'FAILED',
      failureReason: null,
      amount: transaction.amount,
      units: null,
      nav: null,
      balanceBefore: null,
      balanceAfter: null,
      executionDurationMs: 0
    };

    try {
      console.log(`[Scheduler] Executing transaction ${transaction.id} (${transaction.transaction_type})`);

      // Attempt to acquire lock
      const lockAcquired = await transactionModel.lockForExecution(transaction.id);

      if (!lockAcquired) {
        console.log(`[Scheduler] Transaction ${transaction.id} is already locked (concurrency prevention)`);
        logData.status = 'SKIPPED';
        logData.failureReason = 'Transaction already locked by another process';
        logData.executionDurationMs = Date.now() - startTime;

        await executionLogModel.create(logData);

        return {
          transactionId: transaction.id,
          status: 'SKIPPED',
          message: 'Already locked',
          durationMs: logData.executionDurationMs
        };
      }

      try {
        // Check stop conditions before executing
        const shouldStop = await this.checkStopConditions(transaction, executionDate);

        if (shouldStop.shouldStop) {
          console.log(`[Scheduler] Transaction ${transaction.id} reached stop condition:`, shouldStop.reason);

          // Cancel the transaction
          await transactionModel.updateExecutionStatus(transaction.id, {
            status: 'CANCELLED',
            nextExecutionDate: null,
            failureReason: shouldStop.reason
          });

          logData.status = 'SKIPPED';
          logData.failureReason = shouldStop.reason;
          logData.executionDurationMs = Date.now() - startTime;
          await executionLogModel.create(logData);

          await transactionModel.unlock(transaction.id);

          return {
            transactionId: transaction.id,
            status: 'SKIPPED',
            message: shouldStop.reason,
            durationMs: logData.executionDurationMs
          };
        }

        // Get current balance for audit trail
        const account = await demoAccountModel.findByUserId(transaction.user_id);
        logData.balanceBefore = account ? account.balance : 0;

        // Execute based on transaction type
        let executionResult;

        switch (transaction.transaction_type) {
          case 'SIP':
            executionResult = await this.executeSIP(transaction);
            break;
          case 'SWP':
            executionResult = await this.executeSWP(transaction);
            break;
          case 'STP':
            executionResult = await this.executeSTP(transaction);
            break;
          default:
            throw new Error(`Unsupported transaction type: ${transaction.transaction_type}`);
        }

        // Update log data with execution results
        logData.units = executionResult.units;
        logData.nav = executionResult.nav;
        logData.balanceAfter = executionResult.balanceAfter;
        logData.status = 'SUCCESS';
        logData.failureReason = null;

        // Update transaction status and advance schedule
        const nextExecutionDate = this.calculateNextExecutionDate(
          executionDate,
          transaction.frequency
        );

        // Status Logic:
        // All active systematic plans (SIP, SWP, STP) remain SUCCESS
        // This indicates the plan is active and last execution was successful
        let newStatus = 'SUCCESS';

        await transactionModel.updateExecutionStatus(transaction.id, {
          status: newStatus,
          nextExecutionDate,
          lastExecutionDate: executionDate,
          executionCount: transaction.execution_count + 1,
          failureReason: null
        });

        console.log(`[Scheduler] Transaction ${transaction.id} executed successfully. Next execution: ${nextExecutionDate}`);

        // Helper to format date for message
        const formatDateForMsg = (dateStr) => {
          if (!dateStr) return 'N/A';
          return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          });
        };

        // Notification: Success
        if (transaction.transaction_type === 'SWP') {
          await notificationModel.create({
            userId: transaction.user_id,
            title: 'Passive Income Alert! 🎉',
            message: `High Five! Your SWP from ${transaction.scheme_name} executed successfully. ₹${transaction.amount} has been credited to your balance. Next installment: ${formatDateForMsg(nextExecutionDate)}.`,
            type: 'SUCCESS'
          });
        } else if (transaction.transaction_type === 'SIP') {
          await notificationModel.create({
            userId: transaction.user_id,
            title: 'Wealth Builder Alert 🚀',
            message: `✅ Wealth Builder Alert! Your SIP for ${transaction.scheme_name} of ₹${transaction.amount} was successful. Next installment: ${formatDateForMsg(nextExecutionDate)}.`,
            type: 'SUCCESS'
          });
        }

      } catch (error) {
        // Execution failed
        console.error(`[Scheduler] Transaction ${transaction.id} failed:`, error.message);

        logData.status = 'FAILED';
        logData.failureReason = error.message;

        // Update transaction with failure reason but keep PENDING for retry
        await transactionModel.updateExecutionStatus(transaction.id, {
          status: 'PENDING',
          failureReason: error.message
        });

        // Notification: Failure (Specific message for Insufficient Units)
        let failureMessage = `Your ${transaction.transaction_type} for ${transaction.scheme_name} couldn't execute today. Reason: ${error.message}`;
        let failureTitle = 'Action Needed ⚠️';

        if (error.message.includes('Insufficient units') || error.message.includes('Insufficient balance')) {
          failureMessage = `⚠️ Low Balance! Your SWP of ₹${transaction.amount} paused. Please top up your ${transaction.scheme_name} holdings to resume.`;
          failureTitle = 'SWP Paused ⚠️';
        }

        await notificationModel.create({
          userId: transaction.user_id,
          title: failureTitle,
          message: failureMessage,
          type: 'ERROR'
        });

      } finally {
        // Always unlock and log
        await transactionModel.unlock(transaction.id);

        logData.executionDurationMs = Date.now() - startTime;
        await executionLogModel.create(logData);
      }

      return {
        transactionId: transaction.id,
        status: logData.status,
        message: logData.failureReason || 'Executed successfully',
        durationMs: logData.executionDurationMs
      };

    } catch (error) {
      console.error(`[Scheduler] Unexpected error for transaction ${transaction.id}:`, error);

      // Attempt to unlock if error occurred before unlock
      try {
        await transactionModel.unlock(transaction.id);
      } catch (unlockError) {
        console.error(`[Scheduler] Failed to unlock transaction ${transaction.id}:`, unlockError);
      }

      return {
        transactionId: transaction.id,
        status: 'FAILED',
        message: error.message,
        durationMs: Date.now() - startTime
      };
    }
  },

  /**
   * Execute SIP transaction
   */
  async executeSIP(transaction) {
    // Get current NAV from LOCAL DATABASE
    const navData = await localFundService.getLatestNAV(transaction.scheme_code);

    if (!navData || !navData.nav) {
      throw new Error(`NAV not available in local DB for scheme ${transaction.scheme_code}. Run fund sync.`);
    }

    const nav = parseFloat(navData.nav);
    const amount = parseFloat(transaction.amount);

    // Check balance
    const account = await demoAccountModel.findByUserId(transaction.user_id);
    if (!account || account.balance < amount) {
      throw new Error(`Insufficient balance. Required: ₹${amount}, Available: ₹${account.balance || 0}`);
    }

    // Calculate units
    const units = amount / nav;

    // Deduct balance
    await demoAccountModel.updateBalance(transaction.user_id, account.balance - amount);

    // Update holdings
    const existingHolding = await holdingModel.findByScheme(
      transaction.user_id,
      transaction.scheme_code
    );

    if (existingHolding) {
      // Add units and update invested amount
      await holdingModel.addUnits(
        transaction.user_id,
        transaction.scheme_code,
        units,
        amount
      );

      // Update current value with latest NAV
      await holdingModel.updateCurrentValue(
        transaction.user_id,
        transaction.scheme_code,
        nav,
        new Date().toISOString().split('T')[0]
      );
    } else {
      // Create new holding
      await holdingModel.upsert({
        userId: transaction.user_id,
        schemeCode: transaction.scheme_code,
        schemeName: transaction.scheme_name,
        units,
        investedAmount: amount,
        currentValue: units * nav,
        lastNav: nav,
        lastNavDate: new Date().toISOString().split('T')[0]
      });
    }

    const newBalance = account.balance - amount;

    return {
      units,
      nav,
      balanceAfter: newBalance
    };
  },

  /**
   * Execute SWP transaction
   */
  async executeSWP(transaction) {
    // Get current NAV from LOCAL DATABASE
    const navData = await localFundService.getLatestNAV(transaction.scheme_code);

    if (!navData || !navData.nav) {
      throw new Error(`NAV not available in local DB for scheme ${transaction.scheme_code}. Run fund sync.`);
    }

    const nav = parseFloat(navData.nav);
    const amount = parseFloat(transaction.amount);

    // Calculate units to redeem
    const unitsToRedeem = amount / nav;

    // Check holdings
    const holding = await holdingModel.findByScheme(
      transaction.user_id,
      transaction.scheme_code
    );

    if (!holding || parseFloat(holding.total_units) < unitsToRedeem) {
      throw new Error(`Insufficient units. Required: ${unitsToRedeem.toFixed(4)}, Available: ${holding?.total_units || 0}`);
    }

    // Update holdings
    // Calculate proportionate invested amount to remove
    // Calculate proportionate invested amount to remove
    let amountToRemove = 0;
    if (parseFloat(holding.total_units) > 0 && parseFloat(holding.invested_amount) > 0) {
      const costPerUnit = parseFloat(holding.invested_amount) / parseFloat(holding.total_units); // Use total_units from DB
      amountToRemove = costPerUnit * unitsToRedeem;
    }

    await holdingModel.removeUnits(
      transaction.user_id,
      transaction.scheme_code,
      unitsToRedeem,
      amountToRemove
    );

    // Update current value with latest NAV
    await holdingModel.updateCurrentValue(
      transaction.user_id,
      transaction.scheme_code,
      nav,
      new Date().toISOString()
    );

    // Credit balance
    const account = await demoAccountModel.findByUserId(transaction.user_id);
    const newBalance = account.balance + amount;
    await demoAccountModel.updateBalance(transaction.user_id, newBalance);

    return {
      units: unitsToRedeem,
      nav,
      balanceAfter: newBalance
    };
  },

  /**
   * Execute STP transaction
   * Note: Current implementation doesn't have source_scheme_code field.
   * This is a placeholder for future STP implementation.
   */
  async executeSTP(transaction) {
    throw new Error('STP execution not yet implemented. Requires source_scheme_code field in schema.');
  },

  /**
   * Calculate next execution date based on frequency
   * @param {string} currentDate - Current execution date (YYYY-MM-DD)
   * @param {string} frequency - DAILY, WEEKLY, MONTHLY, QUARTERLY
   * @returns {string} Next execution date (YYYY-MM-DD)
   */
  calculateNextExecutionDate(currentDate, frequency) {
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
        throw new Error(`Unsupported frequency: ${frequency}`);
    }

    return next.toISOString().split('T')[0];
  },

  /**
   * Check if transaction should stop (end conditions reached)
   * @param {object} transaction - Transaction to check
   * @param {string} executionDate - Current execution date
   * @returns {object} { shouldStop: boolean, reason: string }
   */
  async checkStopConditions(transaction, executionDate) {
    // Check installments limit
    if (transaction.installments && transaction.execution_count >= transaction.installments) {
      return {
        shouldStop: true,
        reason: `Installments completed (${transaction.execution_count}/${transaction.installments})`
      };
    }

    // Check end date
    if (transaction.end_date) {
      const endDate = new Date(transaction.end_date);
      const execDate = new Date(executionDate);

      if (execDate > endDate) {
        return {
          shouldStop: true,
          reason: `End date reached (${transaction.end_date})`
        };
      }
    }

    return { shouldStop: false, reason: null };
  }
};
