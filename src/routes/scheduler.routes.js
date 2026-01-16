import express from 'express';
import { schedulerController } from '../controllers/scheduler.controller.js';

const router = express.Router();

/**
 * Scheduler Routes
 * API endpoints for SIP/STP/SWP automated execution
 */

// POST /api/scheduler/execute - Manually trigger scheduler
router.post('/execute', schedulerController.execute);

// GET /api/scheduler/due - List due transactions
router.get('/due', schedulerController.getDueTransactions);

// GET /api/scheduler/logs/:transactionId - Get execution history for a transaction
router.get('/logs/:transactionId', schedulerController.getExecutionLogs);

// GET /api/scheduler/failures - Get recent failed executions
router.get('/failures', schedulerController.getRecentFailures);

// GET /api/scheduler/statistics - Get execution statistics for date range
router.get('/statistics', schedulerController.getStatistics);

// POST /api/scheduler/unlock/:transactionId - Manually unlock stuck transaction
router.post('/unlock/:transactionId', schedulerController.unlockTransaction);

export default router;
