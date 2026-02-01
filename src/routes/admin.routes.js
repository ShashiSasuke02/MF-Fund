import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { adminController } from '../controllers/admin.controller.js';
import { getLogFiles, downloadLogFile, downloadAllLogs } from '../controllers/log.controller.js';

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

// Activity logs (Database logs)
router.get('/activity-logs', authenticateToken, requireAdmin, adminController.getActivityLogs);

// [NEW] System Logs (File logs)
router.get('/logs', authenticateToken, requireAdmin, getLogFiles);
router.get('/logs/download-all', authenticateToken, requireAdmin, downloadAllLogs);
router.get('/logs/download/:filename', authenticateToken, requireAdmin, downloadLogFile);

// Sync chart data
router.get('/sync-chart-data', authenticateToken, requireAdmin, adminController.getSyncChartData);

export default router;
