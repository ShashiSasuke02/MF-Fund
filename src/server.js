import 'dotenv/config';
import app from './app.js';
import { initializeDatabase, closeDb } from './db/database.js';
import cacheService from './services/cache.service.js';
import cron from 'node-cron';
import { schedulerService } from './services/scheduler.service.js';
import { mfapiIngestionService } from './services/mfapiIngestion.service.js';

const PORT = process.env.PORT || 4000;

// Initialize database before starting server
try {
  initializeDatabase();
} catch (error) {
  console.error('[Server] Failed to initialize database:', error.message);
  process.exit(1);
}

// Start server
const server = app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════════╗
║                                                               ║
║   🚀 MF Selection App Server                                  ║
║                                                               ║
║   Server running on: http://localhost:${PORT}                   ║
║   Environment: ${process.env.NODE_ENV || 'development'}                              ║
║                                                               ║
║   API Endpoints:                                              ║
║   - GET  /api/health          Health check                    ║
║   - GET  /api/amcs            List all AMCs                   ║
║   - GET  /api/amcs/:id/funds  List funds by AMC               ║
║   - GET  /api/funds/:code     Fund details                    ║
║   - GET  /api/funds/search    Search funds                    ║
║                                                               ║
╚═══════════════════════════════════════════════════════════════╝
  `);
});

// Periodic cache cleanup (every 30 minutes)
const cacheCleanupInterval = setInterval(async () => {
  const cleared = await cacheService.clearExpired();
  if (cleared > 0) {
    console.log(`[Cache] Cleared ${cleared} expired entries`);
  }
}, 30 * 60 * 1000);

// Scheduler cron job (runs daily at 6 AM)
// Only enabled in production, disabled in development/test
let schedulerCron = null;
if (process.env.ENABLE_SCHEDULER_CRON === 'true') {
  schedulerCron = cron.schedule('0 6 * * *', async () => {
    console.log('[Scheduler Cron] Starting daily execution at 6 AM');
    try {
      const result = await schedulerService.executeDueTransactions();
      console.log('[Scheduler Cron] Execution complete:', {
        executed: result.executed,
        failed: result.failed,
        skipped: result.skipped,
        totalDue: result.totalDue,
        durationMs: result.durationMs
      });

      // Log failures if any
      if (result.failed > 0) {
        console.warn('[Scheduler Cron] Failed executions:', result.details.filter(d => d.status === 'FAILED'));
      }
    } catch (error) {
      console.error('[Scheduler Cron] Execution error:', error.message);
    }
  });

  console.log('[Scheduler] Daily cron job enabled (runs at 6 AM)');
  console.log('[Scheduler] To disable, set ENABLE_SCHEDULER_CRON=false in .env');
} else {
  console.log('[Scheduler] Cron job disabled. Use POST /api/scheduler/execute for manual trigger');
  console.log('[Scheduler] To enable automatic execution, set ENABLE_SCHEDULER_CRON=true in .env');
}

// MFAPI Ingestion cron jobs
// Full sync at 2:00 AM IST daily (UTC: 8:30 PM previous day)
let fullSyncCron = null;
if (process.env.ENABLE_FULL_SYNC === 'true') {
  fullSyncCron = cron.schedule('30 20 * * *', async () => {
    console.log('[MFAPI Ingestion] Starting nightly full sync at 2:00 AM IST...');
    try {
      const result = await mfapiIngestionService.runFullSync();
      console.log('[MFAPI Ingestion] Full sync complete:', {
        success: result.success,
        fundsProcessed: result.totalFetched,
        navRecordsAdded: result.navInserted,
        errors: result.errors
      });
      
      if (result.errors > 0) {
        console.warn('[MFAPI Ingestion] Sync had errors. Check logs for details.');
      }
    } catch (error) {
      console.error('[MFAPI Ingestion] Full sync error:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[MFAPI Ingestion] Full sync enabled (runs at 2:00 AM IST daily)');
  console.log('[MFAPI Ingestion] Syncing 10 AMCs: SBI, ICICI, HDFC, Nippon, Kotak, Aditya Birla, UTI, Axis, Tata, Mirae Asset');
} else {
  console.log('[MFAPI Ingestion] Full sync disabled. Use POST /api/ingestion/sync/full for manual trigger');
  console.log('[MFAPI Ingestion] To enable, set ENABLE_FULL_SYNC=true in .env');
}

// Incremental sync at market hours: 10 AM, 12 PM, 2 PM IST (optional)
let incrementalSyncCron = null;
if (process.env.ENABLE_INCREMENTAL_SYNC === 'true') {
  incrementalSyncCron = cron.schedule('0 10,12,14 * * *', async () => {
    console.log('[MFAPI Ingestion] Starting incremental NAV sync...');
    try {
      const result = await mfapiIngestionService.runIncrementalSync();
      console.log('[MFAPI Ingestion] Incremental sync complete:', {
        success: result.success,
        navRecordsUpdated: result.navInserted,
        errors: result.errors
      });
    } catch (error) {
      console.error('[MFAPI Ingestion] Incremental sync error:', error.message);
    }
  }, {
    timezone: 'Asia/Kolkata'
  });

  console.log('[MFAPI Ingestion] Incremental sync enabled (runs at 10 AM, 12 PM, 2 PM IST)');
} else {
  console.log('[MFAPI Ingestion] Incremental sync disabled (optional feature)');
}

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);
  
  // Stop scheduler cron job
  if (schedulerCron) {
    schedulerCron.stop();
    console.log('[Scheduler] Cron job stopped');
  }
  
  // Stop MFAPI ingestion cron jobs
  if (fullSyncCron) {
    fullSyncCron.stop();
    console.log('[MFAPI Ingestion] Full sync cron stopped');
  }
  
  if (incrementalSyncCron) {
    incrementalSyncCron.stop();
    console.log('[MFAPI Ingestion] Incremental sync cron stopped');
  }
  
  // Clear interval
  clearInterval(cacheCleanupInterval);
  
  // Close server
  server.close(() => {
    console.log('[Server] HTTP server closed');
    
    // Close database
    try {
      closeDb();
    } catch (e) {
      console.error('[Server] Error closing database:', e.message);
    }
    
    console.log('[Server] Shutdown complete');
    process.exit(0);
  });
  
  // Force exit after 10 seconds
  setTimeout(() => {
    console.error('[Server] Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('[Server] Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});

export default server;
