import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth.middleware.js';
import { mfapiIngestionService } from '../services/mfapiIngestion.service.js';
import { fundSyncLogModel } from '../models/fundSyncLog.model.js';

const router = express.Router();

/**
 * Admin Ingestion Routes
 * All routes require admin authentication
 */

/**
 * POST /api/ingestion/sync/full
 * Manual trigger for full sync (all funds + NAV from 10 AMCs)
 * Admin only
 */
router.post('/sync/full', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    console.log('[Ingestion API] Manual full sync triggered by admin');
    const result = await mfapiIngestionService.runFullSync();
    
    res.json({
      success: result.success,
      message: result.success ? 'Full sync completed successfully' : 'Full sync failed',
      data: result
    });
  } catch (error) {
    console.error('[Ingestion API] Full sync error:', error);
    next(error);
  }
});

/**
 * POST /api/ingestion/sync/incremental
 * Manual trigger for incremental sync (NAV only for active funds)
 * Admin only
 */
router.post('/sync/incremental', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    console.log('[Ingestion API] Manual incremental sync triggered by admin');
    const result = await mfapiIngestionService.runIncrementalSync();
    
    res.json({
      success: result.success,
      message: result.success ? 'Incremental sync completed successfully' : 'Incremental sync failed',
      data: result
    });
  } catch (error) {
    console.error('[Ingestion API] Incremental sync error:', error);
    next(error);
  }
});

/**
 * GET /api/ingestion/sync/logs
 * Get recent sync logs
 * Admin only
 */
router.get('/sync/logs', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { limit = 10 } = req.query;
    const logs = await fundSyncLogModel.getRecentSyncs(parseInt(limit));
    
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (error) {
    console.error('[Ingestion API] Get logs error:', error);
    next(error);
  }
});

/**
 * GET /api/ingestion/sync/logs/:syncId
 * Get specific sync log by ID
 * Admin only
 */
router.get('/sync/logs/:syncId', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { syncId } = req.params;
    const log = await fundSyncLogModel.getSyncById(parseInt(syncId));
    
    if (!log) {
      return res.status(404).json({
        success: false,
        error: 'Sync log not found'
      });
    }
    
    res.json({
      success: true,
      log
    });
  } catch (error) {
    console.error('[Ingestion API] Get log by ID error:', error);
    next(error);
  }
});

/**
 * GET /api/ingestion/sync/stats
 * Get sync statistics
 * Admin only
 */
router.get('/sync/stats', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    // Get sync statistics
    const syncStats = await fundSyncLogModel.getSyncStatistics(parseInt(days));
    
    // Get ingestion service statistics
    const serviceStats = await mfapiIngestionService.getStatistics();
    
    res.json({
      success: true,
      period: `Last ${days} days`,
      statistics: {
        sync: syncStats,
        database: serviceStats.database,
        lastSync: serviceStats.sync.lastSuccessfulSync,
        whitelistedAMCs: serviceStats.whitelistedAMCs
      }
    });
  } catch (error) {
    console.error('[Ingestion API] Get stats error:', error);
    next(error);
  }
});

/**
 * GET /api/ingestion/sync/status
 * Get current sync status
 * Admin only
 */
router.get('/sync/status', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    // Check for running syncs
    const runningSyncs = await fundSyncLogModel.getSyncsByStatus('STARTED', 5);
    
    // Get last successful sync
    const lastSync = await fundSyncLogModel.getLastSuccessfulSync();
    
    res.json({
      success: true,
      status: {
        isRunning: runningSyncs.length > 0,
        runningSyncs: runningSyncs.map(s => ({
          id: s.id,
          type: s.sync_type,
          startedAt: new Date(s.start_time).toISOString(),
          duration: Date.now() - s.start_time
        })),
        lastSuccessfulSync: lastSync ? {
          id: lastSync.id,
          type: lastSync.sync_type,
          completedAt: new Date(lastSync.end_time).toISOString(),
          duration: lastSync.execution_duration_ms,
          fundsProcessed: lastSync.total_funds_fetched,
          navRecordsAdded: lastSync.nav_records_inserted
        } : null
      }
    });
  } catch (error) {
    console.error('[Ingestion API] Get status error:', error);
    next(error);
  }
});

/**
 * DELETE /api/ingestion/sync/logs/cleanup
 * Clean up old sync logs (older than 90 days)
 * Admin only
 */
router.delete('/sync/logs/cleanup', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { daysToKeep = 90 } = req.query;
    const result = await fundSyncLogModel.cleanupOldLogs(parseInt(daysToKeep));
    
    res.json({
      success: true,
      message: `Cleaned up logs older than ${daysToKeep} days`,
      deletedCount: result.affectedRows || 0
    });
  } catch (error) {
    console.error('[Ingestion API] Cleanup logs error:', error);
    next(error);
  }
});

export default router;
