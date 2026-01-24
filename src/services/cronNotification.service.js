/**
 * Cron Job Notification Service
 * Tracks job completions and sends daily summary email
 */

import { emailService } from './email.service.js';
import { cronJobLogModel } from '../models/cronJobLog.model.js';

// Jobs to track for daily report
const TRACKED_JOBS = [
    'Daily Transaction Scheduler',
    'Full Fund Sync',
    'Incremental Fund Sync'
];

// Store today's job results
let dailyJobResults = new Map();
let lastReportDate = null;

export const cronNotificationService = {
    /**
     * Record a job completion for the daily report
     * @param {string} jobName - Name of the job
     * @param {string} status - SUCCESS or FAILED
     * @param {Object} result - Job result data
     * @param {string} errorDetails - Error message if failed
     * @param {number} durationMs - Job duration in milliseconds
     */
    recordJobCompletion(jobName, status, result = null, errorDetails = null, durationMs = 0) {
        const today = new Date().toISOString().split('T')[0];

        // Reset results if new day
        if (lastReportDate !== today) {
            dailyJobResults.clear();
            lastReportDate = today;
        }

        dailyJobResults.set(jobName, {
            jobName,
            status,
            result,
            errorDetails,
            durationMs,
            completedAt: new Date().toISOString()
        });

        console.log(`[CronNotification] Recorded: ${jobName} = ${status}`);
    },

    /**
     * Check if daily report should be sent (after Transaction Scheduler)
     * @returns {boolean}
     */
    shouldSendReport() {
        // Send report after Daily Transaction Scheduler completes
        return dailyJobResults.has('Daily Transaction Scheduler');
    },

    /**
     * Get all job results from recent logs for the report
     * @returns {Promise<Array>}
     */
    async getJobResultsForReport() {
        const results = [];

        for (const jobName of TRACKED_JOBS) {
            // Check in-memory first
            if (dailyJobResults.has(jobName)) {
                results.push(dailyJobResults.get(jobName));
            } else {
                // Fall back to database for last run
                const lastRun = await cronJobLogModel.getLastRun(jobName);
                if (lastRun) {
                    results.push({
                        jobName: lastRun.job_name,
                        status: lastRun.status,
                        result: lastRun.message ? JSON.parse(lastRun.message) : null,
                        errorDetails: lastRun.error_details,
                        durationMs: lastRun.duration_ms,
                        completedAt: new Date(lastRun.end_time).toISOString()
                    });
                } else {
                    results.push({
                        jobName,
                        status: 'NOT_RUN',
                        result: null,
                        errorDetails: null,
                        durationMs: 0,
                        completedAt: null
                    });
                }
            }
        }

        return results;
    },

    /**
     * Extract transaction count from scheduler result
     * @param {Object} result - Scheduler execution result
     * @returns {number}
     */
    getTransactionCount(result) {
        if (!result) return 0;
        return (result.executed || 0) + (result.failed || 0) + (result.skipped || 0);
    },

    /**
     * Send the daily cron job report email
     */
    async sendDailyReport() {
        const recipient = process.env.CRON_REPORT_EMAIL || 'shashidhar02april@gmail.com';

        if (process.env.ENABLE_CRON_REPORTS !== 'true') {
            console.log('[CronNotification] Reports disabled (ENABLE_CRON_REPORTS != true)');
            return false;
        }

        try {
            const jobResults = await this.getJobResultsForReport();
            const today = new Date().toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // Calculate totals
            const totalDuration = jobResults.reduce((sum, j) => sum + (j.durationMs || 0), 0);
            const successCount = jobResults.filter(j => j.status === 'SUCCESS').length;
            const failedCount = jobResults.filter(j => j.status === 'FAILED').length;

            // Get transaction count from scheduler
            const schedulerResult = jobResults.find(j => j.jobName === 'Daily Transaction Scheduler');
            const transactionCount = schedulerResult ? this.getTransactionCount(schedulerResult.result) : 0;

            const sent = await emailService.sendCronJobReport({
                recipient,
                date: today,
                jobs: jobResults,
                totalDuration,
                successCount,
                failedCount,
                transactionCount
            });

            if (sent) {
                console.log(`[CronNotification] ✅ Daily report sent to ${recipient}`);
                // Clear after sending
                dailyJobResults.clear();
            }

            return sent;
        } catch (error) {
            console.error('[CronNotification] Failed to send report:', error);
            return false;
        }
    },

    /**
     * Called after each job completes - decides whether to send report
     * @param {string} jobName 
     * @param {string} status 
     * @param {Object} result 
     * @param {string} errorDetails 
     * @param {number} durationMs 
     */
    async onJobComplete(jobName, status, result, errorDetails, durationMs) {
        this.recordJobCompletion(jobName, status, result, errorDetails, durationMs);

        // Send report after Daily Transaction Scheduler (6 AM job)
        if (jobName === 'Daily Transaction Scheduler') {
            console.log('[CronNotification] Transaction Scheduler complete - sending daily report...');
            await this.sendDailyReport();
        }
    }
};
