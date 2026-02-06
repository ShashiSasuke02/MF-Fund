
import { initializeDatabase, closeDatabase } from '../src/db/database.js';
import { amfiSyncService } from '../src/services/amfiSync.service.js';
import logger from '../src/services/logger.service.js';

async function runDryRun() {
    console.log('🚀 Starting AMFI NAV Sync DRY RUN...');

    try {
        // 1. Initialize Database
        console.log('📦 Initializing database connection...');
        await initializeDatabase();

        // 2. Run Analysis
        console.log('🔍 Triggering analyzeSync()...');
        const result = await amfiSyncService.analyzeSync();

        // 3. Report Results
        console.log('\n📊 DRY RUN RESULTS:');
        console.log('-------------------');
        console.log(`Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}`);
        console.log(`Total Parsed: ${result.totalParsed}`);
        console.log(`Matched Funds: ${result.matchedFunds}`);
        console.log(`Skipped (No Match): ${result.skippedNoMatch}`);
        console.log(`Errors: ${result.errors}`);
        console.log('-------------------');

        if (result.error) {
            console.error('Error Details:', result.error);
        }

    } catch (error) {
        console.error('❌ Dry run failed:', error);
    } finally {
        // 4. Cleanup
        await closeDatabase();
        console.log('👋 Done.');
        process.exit(0);
    }
}

runDryRun();
