import { demoService } from '../services/demo.service.js';
import { demoAccountModel } from '../models/demoAccount.model.js';

export const demoController = {
  /**
   * Create a transaction (SIP, STP, Lump Sum, SWP)
   */
  async createTransaction(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Validate userId first
      if (!userId || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const { 
        schemeCode, 
        transactionType, 
        amount, 
        frequency, 
        startDate, 
        endDate, 
        installments 
      } = req.body;

      // Validate required fields
      if (!schemeCode || !transactionType || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Scheme code, transaction type, and amount are required'
        });
      }

      // Validate transaction type
      const validTypes = ['SIP', 'STP', 'LUMP_SUM', 'SWP'];
      if (!validTypes.includes(transactionType)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction type. Must be one of: SIP, STP, LUMP_SUM, SWP'
        });
      }

      // Validate frequency for scheduled transactions
      if (transactionType !== 'LUMP_SUM') {
        if (!frequency) {
          return res.status(400).json({
            success: false,
            message: 'Frequency is required for SIP, STP, and SWP'
          });
        }
        
        const validFrequencies = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY'];
        if (!validFrequencies.includes(frequency)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid frequency. Must be one of: DAILY, WEEKLY, MONTHLY, QUARTERLY'
          });
        }
      }

      // Execute transaction
      const result = await demoService.executeTransaction({
        userId,
        schemeCode: parseInt(schemeCode),
        transactionType,
        amount: parseFloat(amount),
        frequency,
        startDate,
        endDate,
        installments: installments ? parseInt(installments) : null
      });

      res.status(201).json({
        success: true,
        message: 'Transaction executed successfully',
        data: result
      });
    } catch (error) {
      if (error.message.includes('Insufficient') || 
          error.message.includes('Invalid') ||
          error.message.includes('not found')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  },

  /**
   * Get portfolio with holdings
   */
  async getPortfolio(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Validate userId
      if (!userId || userId <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid user ID'
        });
      }
      
      const portfolio = await demoService.getPortfolio(userId);

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get transaction history
   */
  async getTransactions(req, res, next) {
    try {
      const userId = req.user.userId;
      const limit = parseInt(req.query.limit) || 50;
      const offset = parseInt(req.query.offset) || 0;

      const transactions = await demoService.getTransactions(userId, limit, offset);

      res.json({
        success: true,
        data: {
          transactions,
          limit,
          offset
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get demo account balance
   */
  async getBalance(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const account = await demoAccountModel.findByUserId(userId);
      
      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Demo account not found'
        });
      }

      res.json({
        success: true,
        data: {
          balance: account.balance,
          createdAt: account.created_at,
          updatedAt: account.updated_at
        }
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get active systematic plans (SIP, STP, SWP)
   */
  async getSystematicPlans(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const plans = await demoService.getSystematicPlans(userId);
      
      res.json({
        success: true,
        data: {
          plans
        }
      });
    } catch (error) {
      next(error);
    }
  }
};
