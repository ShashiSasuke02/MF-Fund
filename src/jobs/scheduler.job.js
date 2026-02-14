
import cron from 'node-cron';
import { cronRegistry } from './registry.js';
export { cronRegistry };
import { cronJobLogModel } from '../models/cronJobLog.model.js';
import { schedulerService } from '../services/scheduler.service.js';
import { mfapiIngestionService } from '../services/mfapiIngestion.service.js';
import { amfiSyncService } from '../services/amfiSync.service.js';
import { cronNotificationService } from '../services/cronNotification.service.js';
import logger from '../services/logger.service.js';

/**
 * Uptime Kuma Push Monitor
 * Maps job names to env var URLs and sends a non-blocking GET request.
 * Fire-and-forget — never blocks or fails the parent job.
 */
const KUMA_PUSH_MAP = {
    'Daily Transaction Scheduler': 'KUMA_PUSH_SIP_URL',
    'Full Fund Sync': 'KUMA_PUSH_FUND_SYNC_URL',
    'AMFI NAV Sync': 'KUMA_PUSH_AMFI_SYNC_URL',
    'Daily Database Backup': 'KUMA_PUSH_BACKUP_URL',
};

const pingUptimeKuma = async (jobName) => {
    const envVar = KUMA_PUSH_MAP[jobName];
    if (!envVar) return;
    const url = process.env[envVar];
    if (!url) return;
    try {
        await fetch(url, { signal: AbortSignal.timeout(10000) });
        logger.info(`[Cron] 📡 Uptime Kuma pinged for: ${jobName}`);
    } catch (err) {
        logger.warn(`[Cron] ⚠️ Uptime Kuma ping failed for ${jobName}: ${err.message}`);
    }
};


/**
 * executeJobWrapper
 * Wraps job execution with logging and error handling
 */
const executeJobWrapper = async (jobName, handler, triggeredBy = 'SCHEDULE') => {
    logger.info(`[Cron] 🚀 Starting job: ${jobName} (${triggeredBy})`);
    const startTime = Date.now();

    // Create initial log entry
    let logId;
    try {
        logId = await cronJobLogModel.create({
            job_name: jobName,
            status: 'RUNNING',
            triggered_by: triggeredBy,
            start_time: startTime
        });
    } catch (err) {
        logger.error(`[Cron] Failed to create log for ${jobName}: ${err.message}`);
    }

    try {
        // Execute the actual job handler
        const result = await handler();

        const duration = Date.now() - startTime;
        logger.info(`[Cron] ✅ Job completed: ${jobName} in ${duration}ms`);

        // Update log with success
        if (logId) {
            await cronJobLogModel.update(logId, {
                status: 'SUCCESS',
                end_time: Date.now(),
                duration_ms: duration,
                message: result ? JSON.stringify(result) : 'Completed successfully'
            });
        }

        // Notify for daily report
        await cronNotificationService.onJobComplete(jobName, 'SUCCESS', result, null, duration);

        // Ping Uptime Kuma heartbeat (non-blocking)
        pingUptimeKuma(jobName).catch(() => { });

        return { success: true, result };

    } catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`[Cron] ❌ Job failed: ${jobName}: ${error.message}`);

        // Update log with failure
        if (logId) {
            await cronJobLogModel.update(logId, {
                status: 'FAILED',
                end_time: Date.now(),
                duration_ms: duration,
                error_details: error.message + '\n' + error.stack
            });
        }

        // Notify for daily report (even on failure)
        await cronNotificationService.onJobComplete(jobName, 'FAILED', null, error.message, duration);

        throw error;
    }
};


/**
 * Initialize Scheduler Jobs
 * Sets up cron jobs for automated tasks
 */
export const initSchedulerJobs = () => {
    logger.info('[Cron] Initializing scheduler jobs...');

    // 1. Register Daily Transaction Scheduler (6:00 AM)
    cronRegistry.register('Daily Transaction Scheduler', '0 6 * * *', async () => {
        const today = new Date().toISOString().split('T')[0];
        return await schedulerService.executeDueTransactions(today);
    });

    // 2. Register Full Fund Sync (2:00 AM IST = 30 20 * * * UTC)
    // Note: The previous logic used timezone: 'Asia/Kolkata'. node-cron supports this.
    // We will register it but handle the enablement check inside the wrapper/registration if needed,
    // OR we register it unconditionally and let the manual trigger work, but only schedule if enabled.
    // For manual trigger visibility, it's better to register it.

    // 2. Register Full Fund Sync (1:00 AM IST)
    // After completion (success or failure), AMFI NAV Sync runs automatically
    cronRegistry.register('Full Fund Sync', '0 0 1 * * *', async () => {
        let fullSyncResult = null;
        let amfiSyncResult = null;

        try {
            fullSyncResult = await mfapiIngestionService.runFullSync();
        } catch (error) {
            logger.error(`[Cron] Full Fund Sync failed: ${error.message}`);
            fullSyncResult = { success: false, error: error.message };
        }

        // Always run AMFI Sync after Full Sync (regardless of success/failure)
        const amfiStartTime = Date.now();
        try {
            logger.info('[Cron] Full Fund Sync completed. Running AMFI NAV Sync...');
            amfiSyncResult = await amfiSyncService.runSync();
        } catch (error) {
            logger.error(`[Cron] AMFI NAV Sync failed: ${error.message}`);
            amfiSyncResult = { success: false, error: error.message };
        }

        // Return combined result for single email report (NIGHTLY_SYNC)
        return {
            fullSync: fullSyncResult,
            amfiSync: amfiSyncResult,
            amfiDuration: Date.now() - amfiStartTime
        };
    });

    // 3. Register AMFI NAV Sync (Scheduled + Manual)
    // Runs at 11:00 PM IST (to capture early updates) and 05:00 AM IST (late updates)
    // Also available for manual trigger via Admin Dashboard
    const amfiSchedule = process.env.ENABLE_AMFI_SYNC_SCHEDULE === 'true' ? '0 5,23 * * *' : 'MANUAL_ONLY';
    cronRegistry.register('AMFI NAV Sync', amfiSchedule, async () => {
        return await amfiSyncService.runSync();
    });

    // 4. Register Peer Fund Enrichment (Daily at 3:00 AM IST)
    // Propagates metadata from enriched funds to their peers
    const peerEnrichmentSchedule = '0 3 * * *';
    cronRegistry.register('Peer Fund Enrichment', peerEnrichmentSchedule, async () => {
        // Dynamic import to avoid circular dependencies if any
        const { peerEnrichmentService } = await import('../services/peerEnrichment.service.js');
        return await peerEnrichmentService.runDailyEnrichment();
    });

    // 5. Register Incremental Fund Sync (Manual Only - Admin Dashboard)
    // NOTE: This job is DISABLED by default. Legacy API-based sync, use AMFI Sync instead.
    cronRegistry.register('Incremental Fund Sync', 'MANUAL_ONLY', async () => {
        return await mfapiIngestionService.runIncrementalSync();
    });

    // 6. Register Daily Database Backup (2:00 AM IST)
    cronRegistry.register('Daily Database Backup', '0 2 * * *', async () => {
        const { backupService } = await import('../services/backup.service.js');
        return await backupService.runDailyBackup();
    });

    // 4. Schedule all registered jobs
    const jobs = cronRegistry.getAllJobs();

    jobs.forEach(job => {
        // Check enablement via env vars for specific jobs
        let isEnabled = true;
        if (job.name === 'Full Fund Sync' && process.env.ENABLE_FULL_SYNC !== 'true') {
            isEnabled = false;
        }
        if (job.name === 'Incremental Fund Sync' && process.env.ENABLE_INCREMENTAL_SYNC !== 'true') {
            isEnabled = false;
        }

        if (isEnabled) {
            // Skip cron scheduling for manual-only jobs
            if (job.schedule === 'MANUAL_ONLY') {
                logger.info(`[Cron] Registered: ${job.name} (Manual Trigger Only)`);
                job.isRunning = true;
                return;
            }

            // Validate schedule for automated jobs
            if (!cron.validate(job.schedule)) {
                logger.error(`[Cron] Invalid schedule for ${job.name}: ${job.schedule}`);
                return;
            }

            // Apply Timezone for sync jobs if needed, or default system time
            // The previous code used 'Asia/Kolkata' explicitly for sync jobs.
            // We can pass options if we enhance the registry to store them.
            // For simplicity, we assume server time or simple cron.
            // To match previous behavior exactly, we might need to hardcode options for now or update registry.

            // Apply IST timezone for ALL scheduled jobs
            const options = { timezone: 'Asia/Kolkata' };

            cron.schedule(job.schedule, () => {
                executeJobWrapper(job.name, job.handler, 'SCHEDULE');
            }, options);

            logger.info(`[Cron] Scheduled: ${job.name} at ${job.schedule}`);
            job.isRunning = true;
        } else {
            logger.info(`[Cron] Job logged but disabled: ${job.name} (Enable via ENV)`);
        }
    });

    logger.info(`[Cron] ✅ Initialized ${jobs.length} jobs.`);
};

/**
 * Manually trigger a job
 * @param {string} jobName 
 */
export const triggerJobManually = async (jobName) => {
    const job = cronRegistry.getJob(jobName);
    if (!job) {
        throw new Error(`Job not found: ${jobName}`);
    }
    return executeJobWrapper(jobName, job.handler, 'MANUAL');
};
