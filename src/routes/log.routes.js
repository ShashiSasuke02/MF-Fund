import express from 'express';
import { logClientError } from '../controllers/log.controller.js';

const router = express.Router();

// POST /api/logs/client - Ingest client-side errors
// You might want to add rate limiting specifically for this route in the future
router.post('/client', logClientError);

export default router;
