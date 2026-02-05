/**
 * AMFI NAV Sync - Dry Run Test Script
 * 
 * Purpose: Test the new AMFI text-based sync without modifying the database.
 * 
 * Usage:
 *   node scripts/test-amfi-sync.js
 *   
 *   # Or in Docker:
 *   docker compose exec backend node scripts/test-amfi-sync.js
 */

import 'dotenv/config';
import { amfiSyncService } from '../src/services/amfiSync.service.js';
import { initializeDatabase, closeDatabase } from '../src/db/database.js';

async function main() {
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║         AMFI NAV Sync - Dry Run Analysis                 ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    try {
        // Initialize database connection
        console.log('[Setup] Connecting to database...');
        await initializeDatabase(5, 2000); // 5 retries, 2s interval
        console.log('[Setup] Database connected.\n');

        // Run dry analysis
        console.log('[Test] Running AMFI sync in DRY RUN mode...\n');
        const startTime = Date.now();
        const result = await amfiSyncService.analyzeSync();
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);

        // Print results
        console.log('\n╔══════════════════════════════════════════════════════════╗');
        console.log('║                     ANALYSIS RESULTS                      ║');
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log(`║  Total Records Parsed:  ${String(result.totalParsed).padStart(10)}                  ║`);
        console.log(`║  Matched to DB Funds:   ${String(result.matchedFunds).padStart(10)}                  ║`);
        console.log(`║  Skipped (Not Tracked): ${String(result.skippedNoMatch).padStart(10)}                  ║`);
        console.log(`║  Duration:              ${String(duration + 's').padStart(10)}                  ║`);
        console.log('╠══════════════════════════════════════════════════════════╣');
        console.log(`║  Status: ${result.success ? '✅ SUCCESS' : '❌ FAILED'}                                     ║`);
        console.log('╚══════════════════════════════════════════════════════════╝\n');

        if (result.success && result.matchedFunds > 0) {
            console.log('[Conclusion] The AMFI sync is working correctly!');
            console.log('[Next Step] To enable live sync, update scheduler.job.js to call amfiSyncService.runSync()');
        } else if (result.matchedFunds === 0) {
            console.log('[Warning] No funds matched. Check if database has active funds.');
        }

    } catch (error) {
        console.error('[Error]', error.message);
        console.error(error.stack);
        process.exitCode = 1;
    } finally {
        // Cleanup
        console.log('\n[Cleanup] Closing database connection...');
        await closeDatabase();
        console.log('[Done]');
    }
}

main();

