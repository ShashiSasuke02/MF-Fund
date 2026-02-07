import express from 'express';
import ledgerController from '../controllers/ledger.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

// All routes are protected
router.use(authenticateToken);

router.get('/', ledgerController.getLedger);

export default router;
