import express from 'express';
import { demoController } from '../controllers/demo.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All demo routes require authentication
router.use(authenticateToken);

// Transaction routes
router.post('/transactions', demoController.createTransaction);
router.get('/transactions', demoController.getTransactions);

// Systematic plans routes
router.get('/systematic-plans', demoController.getSystematicPlans);

// Portfolio routes
router.get('/portfolio', demoController.getPortfolio);

// Balance routes
router.get('/balance', demoController.getBalance);

export default router;
