import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { adminController } from '../controllers/admin.controller.js';
import { getLogFiles, downloadLogFile, downloadAllLogs } from '../controllers/log.controller.js';
import { getBackupFiles, downloadBackupFile, downloadAllBackups } from '../controllers/backup.controller.js';
import { settingsService } from '../services/settings.service.js';
import { ollamaService } from '../services/ollama.service.js';

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

// [NEW] Database Backups
router.get('/backups', authenticateToken, requireAdmin, getBackupFiles);
router.get('/backups/download-all', authenticateToken, requireAdmin, downloadAllBackups);
router.get('/backups/download/:filename', authenticateToken, requireAdmin, downloadBackupFile);

// Sync chart data
router.get('/sync-chart-data', authenticateToken, requireAdmin, adminController.getSyncChartData);

// ==================== AI Settings Management ====================

// Get all settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const settings = await settingsService.getAll();
        res.json({ success: true, settings });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get settings' });
    }
});

// Update a setting
router.post('/settings', authenticateToken, requireAdmin, async (req, res) => {
    const { key, value, description } = req.body;

    if (!key || value === undefined) {
        return res.status(400).json({ error: 'Key and value are required' });
    }

    try {
        await settingsService.set(key, value, description);
        res.json({ success: true, message: `Setting '${key}' updated successfully` });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update setting' });
    }
});

// Get AI Status (public-ish - any authenticated user can check)
router.get('/ai/status', async (req, res) => {
    try {
        const enabled = await settingsService.isAiEnabled();
        const model = await settingsService.getAiModel();
        const connected = await ollamaService.checkConnection();

        res.json({
            success: true,
            ai: {
                enabled,
                model,
                connected,
                endpoint: process.env.OLLAMA_ENDPOINT || 'http://192.168.1.4:11434'
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get AI status' });
    }
});

// List available Ollama models (Admin only)
router.get('/ai/models', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const models = await ollamaService.listModels();
        res.json({ success: true, models });
    } catch (error) {
        res.status(503).json({
            success: false,
            error: 'Ollama server unreachable',
            models: []
        });
    }
});

export default router;
