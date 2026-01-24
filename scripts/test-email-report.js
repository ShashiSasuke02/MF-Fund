/**
 * Test script for cron email notification
 * Run: node scripts/test-email-report.js
 */
import 'dotenv/config';
import { emailService } from '../src/services/email.service.js';

async function testEmailReport() {
    console.log('Testing Cron Email Report...');
    console.log('ENABLE_CRON_REPORTS:', process.env.ENABLE_CRON_REPORTS);
    console.log('CRON_REPORT_EMAIL:', process.env.CRON_REPORT_EMAIL);

    const testReportData = {
        recipient: process.env.CRON_REPORT_EMAIL,
        date: new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }),
        jobs: [
            {
                jobName: 'MFAPI Full Fund Sync',
                status: 'SUCCESS',
                durationMs: 17000,
                result: {
                    totalFetched: 4421,
                    inserted: 4421,
                    navInserted: 4357,
                    errors: 0,
                    skippedInactive: 28805
                }
            },
            {
                jobName: 'Daily Transaction Scheduler',
                status: 'SUCCESS',
                durationMs: 2500,
                result: {
                    executed: 12
                }
            }
        ],
        totalDuration: 19500,
        successCount: 2,
        failedCount: 0,
        transactionCount: 12
    };

    try {
        const result = await emailService.sendCronJobReport(testReportData);
        console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Email failed:', error.message);
        console.error(error.stack);
    }
}

testEmailReport();
