
import cron from 'node-cron';
import { cronRegistry } from './registry.js';
export { cronRegistry };
import { cronJobLogModel } from '../models/cronJobLog.model.js';
import { schedulerService } from '../services/scheduler.service.js';
import { mfapiIngestionService } from '../services/mfapiIngestion.service.js';
import { cronNotificationService } from '../services/cronNotification.service.js';


/**
 * executeJobWrapper
 * Wraps job execution with logging and error handling
 */
const executeJobWrapper = async (jobName, handler, triggeredBy = 'SCHEDULE') => {
    console.log(`[Cron] 🚀 Starting job: ${jobName} (${triggeredBy})`);
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
        console.error(`[Cron] Failed to create log for ${jobName}:`, err);
    }

    try {
        // Execute the actual job handler
        const result = await handler();

        const duration = Date.now() - startTime;
        console.log(`[Cron] ✅ Job completed: ${jobName} in ${duration}ms`);

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

        return { success: true, result };

    } catch (error) {
        const duration = Date.now() - startTime;
        console.error(`[Cron] ❌ Job failed: ${jobName}`, error);

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
    console.log('[Cron] Initializing scheduler jobs...');

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
    // Note: Timezone IS 'Asia/Kolkata' (handled below in line 138 options)
    cronRegistry.register('Full Fund Sync', '0 0 1 * * *', async () => {
        // NOTE: The previous code had specific TZ logic.
        // Standard cron doesn't do TZ easily without the option. 
        // We'll trust the registry/scheduler loop to handle it or use the string directly.
        // The wrapper below uses cron.schedule(job.schedule) which can take options. 
        // For now, let's just wrap the service call.
        return await mfapiIngestionService.runFullSync();
    });

    // 3. Register Incremental Fund Sync (DISABLED)
    // cronRegistry.register('Incremental Fund Sync', '0 10,12,14 * * *', async () => {
    //     return await mfapiIngestionService.runIncrementalSync();
    // });

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
            // Validate schedule
            if (!cron.validate(job.schedule)) {
                console.error(`[Cron] Invalid schedule for ${job.name}: ${job.schedule}`);
                return;
            }

            // Apply Timezone for sync jobs if needed, or default system time
            // The previous code used 'Asia/Kolkata' explicitly for sync jobs.
            // We can pass options if we enhance the registry to store them.
            // For simplicity, we assume server time or simple cron.
            // To match previous behavior exactly, we might need to hardcode options for now or update registry.

            let options = {};
            // Apply IST timezone for all scheduled jobs
            if (job.name.includes('Fund Sync') || job.name === 'Daily Transaction Scheduler') {
                options = { timezone: 'Asia/Kolkata' };
            }

            cron.schedule(job.schedule, () => {
                executeJobWrapper(job.name, job.handler, 'SCHEDULE');
            }, options);

            console.log(`[Cron] Scheduled: ${job.name} at ${job.schedule}`);
            job.isRunning = true;
        } else {
            console.log(`[Cron] Job logged but disabled: ${job.name} (Enable via ENV)`);
        }
    });

    console.log(`[Cron] ✅ Initialized ${jobs.length} jobs.`);
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
