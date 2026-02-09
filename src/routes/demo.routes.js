import express from 'express';
import { demoController } from '../controllers/demo.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { createTransactionSchema } from '../validators/demo.schema.js';

const router = express.Router();

// All demo routes require authentication
router.use(authenticateToken);

// Transaction routes
// Transaction routes
router.post('/transactions', validate(createTransactionSchema), demoController.createTransaction);
router.get('/transactions', demoController.getTransactions);
router.post('/transactions/:id/cancel', demoController.cancelTransaction);

// Systematic plans routes
router.get('/systematic-plans', demoController.getSystematicPlans);

// Portfolio routes
router.get('/portfolio', demoController.getPortfolio);

// Balance routes
router.get('/balance', demoController.getBalance);

export default router;
