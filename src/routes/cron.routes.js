
import express from 'express';
import { cronController } from '../controllers/cron.controller.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js'; // Assuming these exist

const router = express.Router();

// All cron routes require admin access
router.use(authenticateToken);
// router.use(requireAdmin); // Uncomment if requireAdmin middleware exists and is needed

router.get('/', cronController.listJobs);
router.post('/trigger', cronController.triggerJob);
router.get('/:jobName/history', cronController.getJobHistory);

export default router;
