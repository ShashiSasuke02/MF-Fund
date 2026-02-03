import express from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticateToken } from '../middleware/auth.middleware.js';

const router = express.Router();

/**
 * AI Routes - All routes require authentication
 */

// POST /api/ai/chat - Send message to AI
router.post('/chat', authenticateToken, aiController.chat);

// GET /api/ai/status - Check AI availability
router.get('/status', authenticateToken, aiController.status);

export default router;
