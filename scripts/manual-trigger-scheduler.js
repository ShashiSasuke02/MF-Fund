import { schedulerService } from '../src/services/scheduler.service.js';
import { initializeDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function runManualScheduler() {
    try {
        console.log('[Manual Trigger] Initializing DB...');
        await initializeDatabase();

        console.log('[Manual Trigger] Executing scheduler service...');
        const result = await schedulerService.executeDueTransactions();

        console.log('[Manual Trigger] Result:', JSON.stringify(result, null, 2));
        process.exit(0);
    } catch (error) {
        console.error('[Manual Trigger] Failed:', error);
        process.exit(1);
    }
}

runManualScheduler();
