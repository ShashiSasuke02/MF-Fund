import { demoAccountModel } from '../models/demoAccount.model.js';
import { transactionModel } from '../models/transaction.model.js';
import { holdingModel } from '../models/holding.model.js';
import mfApiService from './mfapi.service.js';

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
    // Get current balance
    const currentBalance = demoAccountModel.getBalance(userId);
    
    console.log('[Demo Service] executeTransaction - userId:', userId, 'currentBalance:', currentBalance, 'amount:', amount);
    
    if (!currentBalance && currentBalance !== 0) {
      throw new Error('Demo account not found');
    }

    // Get fund details from API
    const fundDetails = await mfApiService.getSchemeDetails(schemeCode);
    if (!fundDetails || !fundDetails.meta) {
      throw new Error('Invalid scheme code');
    }

    const schemeName = fundDetails.meta.scheme_name;
    const latestNav = parseFloat(fundDetails.latestNAV?.nav || 0);
    
    if (!latestNav) {
      throw new Error('NAV not available for this scheme');
    }

    // Validate transaction based on type
    if (transactionType === 'LUMP_SUM' || transactionType === 'SIP' || transactionType === 'STP') {
      // Purchase transactions - check sufficient balance
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      if (currentBalance < amount) {
        throw new Error('Insufficient demo balance');
      }

      // Calculate units
      const units = amount / latestNav;

      // Create transaction record
      const transaction = await transactionModel.create({
        userId,
        schemeCode,
        schemeName,
        transactionType,
        amount,
        units,
        nav: latestNav,
        frequency: transactionType === 'LUMP_SUM' ? null : frequency,
        startDate: transactionType === 'LUMP_SUM' ? null : startDate,
        endDate: transactionType === 'LUMP_SUM' ? null : endDate,
        installments: transactionType === 'LUMP_SUM' ? null : installments,
        status: 'SUCCESS'
      });

      // Update demo balance
      const newBalance = currentBalance - amount;
      console.log('[Demo Service] Updating balance - old:', currentBalance, 'new:', newBalance, 'deducted:', amount);
      demoAccountModel.updateBalance(userId, newBalance);

      // Update or create holding
      const existingHolding = holdingModel.findByScheme(userId, schemeCode);
      
      if (existingHolding) {
        await holdingModel.upsert({
          userId,
          schemeCode,
          schemeName,
          units: existingHolding.total_units + units,
          investedAmount: existingHolding.invested_amount + amount,
          currentValue: (existingHolding.total_units + units) * latestNav,
          lastNav: latestNav,
          lastNavDate: fundDetails.latestNAV?.date
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
          lastNavDate: fundDetails.latestNAV?.date
        });
      }

      return {
        transaction,
        newBalance,
        holding: holdingModel.findByScheme(userId, schemeCode)
      };
    } else if (transactionType === 'SWP') {
      // Withdrawal transaction - check sufficient units
      if (amount <= 0) {
        throw new Error('Amount must be greater than zero');
      }

      const holding = holdingModel.findByScheme(userId, schemeCode);
      if (!holding) {
        throw new Error('No holdings found for this scheme');
      }

      const requiredUnits = amount / latestNav;
      
      if (holding.total_units < requiredUnits) {
        throw new Error('Insufficient units for withdrawal');
      }

      // Create transaction record
      const transaction = await transactionModel.create({
        userId,
        schemeCode,
        schemeName,
        transactionType,
        amount,
        units: -requiredUnits, // Negative for withdrawal
        nav: latestNav,
        frequency,
        startDate,
        endDate,
        installments,
        status: 'SUCCESS'
      });

      // Update demo balance (credit)
      const newBalance = currentBalance + amount;
      demoAccountModel.updateBalance(userId, newBalance);

      // Update holding (remove units)
      holdingModel.removeUnits(userId, schemeCode, requiredUnits, amount);

      return {
        transaction,
        newBalance,
        holding: holdingModel.findByScheme(userId, schemeCode)
      };
    } else {
      throw new Error('Invalid transaction type');
    }
  },

  /**
   * Get portfolio summary
   */
  async getPortfolio(userId) {
    const holdings = holdingModel.findByUserId(userId);
    const balance = demoAccountModel.getBalance(userId);
    
    // Update current values with latest NAV
    const updatedHoldings = await Promise.all(
      holdings.map(async (holding) => {
        try {
          const latestData = await mfApiService.getLatestNAV(holding.scheme_code);
          if (latestData && latestData.data && latestData.data[0]) {
            const latestNav = parseFloat(latestData.data[0].nav);
            const currentValue = holding.total_units * latestNav;
            
            holdingModel.updateCurrentValue(
              userId, 
              holding.scheme_code, 
              latestNav, 
              latestData.data[0].date
            );
            
            return {
              ...holding,
              last_nav: latestNav,
              last_nav_date: latestData.data[0].date,
              current_value: currentValue,
              returns: currentValue - holding.invested_amount,
              returns_percentage: ((currentValue - holding.invested_amount) / holding.invested_amount) * 100
            };
          }
        } catch (error) {
          console.error(`Failed to update NAV for scheme ${holding.scheme_code}:`, error.message);
        }
        
        return {
          ...holding,
          returns: holding.current_value - holding.invested_amount,
          returns_percentage: holding.invested_amount > 0 
            ? ((holding.current_value - holding.invested_amount) / holding.invested_amount) * 100 
            : 0
        };
      })
    );

    const totalInvested = updatedHoldings.reduce((sum, h) => sum + h.invested_amount, 0);
    const totalCurrent = updatedHoldings.reduce((sum, h) => sum + (h.current_value || 0), 0);
    const totalReturns = totalCurrent - totalInvested;

    return {
      balance,
      holdings: updatedHoldings,
      summary: {
        totalInvested,
        totalCurrent,
        totalReturns,
        returnsPercentage: totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0
      }
    };
  },

  /**
   * Get transaction history
   */
  getTransactions(userId, limit = 50, offset = 0) {
    return transactionModel.findByUserId(userId, limit, offset);
  }
};
