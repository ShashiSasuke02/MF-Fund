import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { adminController } from '../controllers/admin.controller.js';

const router = express.Router();

/**
 * Admin Routes - All routes require authentication + admin role
 */

// Dashboard statistics
router.get('/dashboard-stats', authenticateToken, requireAdmin, adminController.getDashboardStats);

// User management
router.get('/users', authenticateToken, requireAdmin, adminController.getUsers);

// Cache control
router.post('/cache/clear', authenticateToken, requireAdmin, adminController.clearCache);

// Activity logs
router.get('/activity-logs', authenticateToken, requireAdmin, adminController.getActivityLogs);

// Sync chart data
router.get('/sync-chart-data', authenticateToken, requireAdmin, adminController.getSyncChartData);

export default router;
