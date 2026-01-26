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
     * @param {Object} options - { jobFilter, reportType: 'SCHEDULER' | 'SYNC' }
     */
    async sendDailyReport(options = {}) {
        const recipient = process.env.CRON_REPORT_EMAIL || 'shashidhar02april@gmail.com';
        const { jobFilter, reportType } = options;

        if (process.env.ENABLE_CRON_REPORTS !== 'true') {
            console.log('[CronNotification] Reports disabled (ENABLE_CRON_REPORTS != true)');
            return false;
        }

        try {
            let jobResults = await this.getJobResultsForReport();

            // Filter logic
            if (jobFilter) {
                jobResults = jobResults.filter(j => j.jobName === jobFilter);
            }

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

            // Extra Data Extraction based on Report Type
            let stats = {};

            if (reportType === 'SCHEDULER') {
                const schedulerResult = jobResults.find(j => j.jobName === 'Daily Transaction Scheduler');
                stats.transactionCount = schedulerResult ? this.getTransactionCount(schedulerResult.result) : 0;
                stats.totalInvested = (schedulerResult && schedulerResult.result) ? (schedulerResult.result.totalInvested || 0) : 0;
                stats.totalWithdrawn = (schedulerResult && schedulerResult.result) ? (schedulerResult.result.totalWithdrawn || 0) : 0;
            }
            else if (reportType === 'SYNC') {
                const syncResult = jobResults.find(j => j.jobName === 'Full Fund Sync');
                // stats for sync
                // Note: 'inserted' = funds inserted/upserted
                // Note: 'navUpdated' = NAVs updated
                stats.fundsFetched = (syncResult && syncResult.result) ? (syncResult.result.totalFetched || 0) : 0;
                stats.fundsInserted = (syncResult && syncResult.result) ? (syncResult.result.inserted || 0) : 0;
                stats.navUpdated = (syncResult && syncResult.result) ? (syncResult.result.navInserted || 0) : 0;
                stats.skippedInactive = (syncResult && syncResult.result) ? (syncResult.result.skippedInactive || 0) : 0;
                stats.markedInactive = (syncResult && syncResult.result) ? (syncResult.result.markedInactive || 0) : 0;
                stats.errors = (syncResult && syncResult.result) ? (syncResult.result.errors || 0) : 0;
            }

            const sent = await emailService.sendCronJobReport({
                recipient,
                date: today,
                jobs: jobResults,
                totalDuration,
                successCount,
                failedCount,
                reportType,
                ...stats
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
     */
    async onJobComplete(jobName, status, result, errorDetails, durationMs) {
        this.recordJobCompletion(jobName, status, result, errorDetails, durationMs);

        // 1. Daily Transaction Scheduler (6 AM job)
        if (jobName === 'Daily Transaction Scheduler') {
            if (process.env.ENABLE_TRANSACTION_SCHEDULER_REPORT !== 'true') return;

            console.log(`[CronNotification] ${jobName} complete - sending Transaction Scheduler Report...`);
            await this.sendDailyReport({ jobFilter: 'Daily Transaction Scheduler', reportType: 'SCHEDULER' });
        }

        // 2. Full Fund Sync (2:30 AM job)
        if (jobName === 'Full Fund Sync') {
            if (process.env.ENABLE_FULL_SYNC_REPORT !== 'true') return;

            console.log(`[CronNotification] ${jobName} complete - sending Full Fund Sync Report...`);
            await this.sendDailyReport({ jobFilter: 'Full Fund Sync', reportType: 'SYNC' });
        }
    }
};
