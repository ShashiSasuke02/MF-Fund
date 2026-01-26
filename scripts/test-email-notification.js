
/**
 * Test Script: Scheduler Email Notification
 * Simulates a scheduler execution and triggers the email report.
 */

import 'dotenv/config';
import { cronNotificationService } from '../src/services/cronNotification.service.js';
import { initializeDatabase } from '../src/db/database.js';

async function testEmailReport() {
    console.log('--- Testing Scheduler Email Report ---');

    // Initialize DB for cron logs lookup
    await initializeDatabase();

    console.log(`ENV Check:`);
    console.log(`ENABLE_CRON_REPORTS: ${process.env.ENABLE_CRON_REPORTS}`);
    console.log(`ENABLE_TRANSACTION_SCHEDULER_REPORT: ${process.env.ENABLE_TRANSACTION_SCHEDULER_REPORT}`);
    console.log(`CRON_REPORT_EMAIL: ${process.env.CRON_REPORT_EMAIL}`);

    // Mock Scheduler Result
    // 5 SIPs (Total 25000), 1 SWP (5000), 1 Failed
    const mockResult = {
        executed: 6,
        failed: 1,
        skipped: 0,
        totalInvested: 25000,
        totalWithdrawn: 5000,
        details: []
    };

    console.log('\nSimulating "Daily Transaction Scheduler" completion...');

    // Call the service manually
    try {
        await cronNotificationService.onJobComplete(
            'Daily Transaction Scheduler',
            'SUCCESS', // Status of the job itself (even if some txns failed, job might be SUCCESS)
            mockResult, // The financial data
            null, // No job-level error
            2500 // 2.5s duration
        );

        console.log('\n✅ Test execution finished. Check logs above for "EmailService" output.');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testEmailReport();
