
import 'dotenv/config';
import { mfapiIngestionService } from '../src/services/mfapiIngestion.service.js';
import { initializeDatabase } from '../src/db/database.js';
import { seedAMCs } from './seed-amcs.js';
import { cronNotificationService } from '../src/services/cronNotification.service.js';

async function fullSync() {
    const jobName = 'Full Fund Sync';
    const startTime = Date.now();
    console.log(`Starting ${jobName} Job...`);

    try {
        // 0. Startup Delay (Allow Docker network to stabilize)
        console.log('Waiting 5s for network stability...');
        await new Promise(resolve => setTimeout(resolve, 5000));

        // 1. Initialize DB
        await initializeDatabase();

        // 2. Seed AMCs (Critical for mapping funds)
        await seedAMCs(false); // false = don't exit process

        // 3. Fetch Funds
        console.log('Fetching New Funds + NAV + Categories...');
        const result = await mfapiIngestionService.runFullSync();

        const duration = Date.now() - startTime;
        await cronNotificationService.onJobComplete(jobName, 'SUCCESS', result, null, duration);

        console.log('Full Sync Complete.');
        process.exit(0);
    } catch (error) {
        console.error('Full Sync Failed:', error);
        const duration = Date.now() - startTime;
        await cronNotificationService.onJobComplete(jobName, 'FAILED', null, error.message, duration);
        process.exit(1);
    }
}

fullSync();
