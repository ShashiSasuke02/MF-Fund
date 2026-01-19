/**
 * Nightly MFAPI Ingestion Script
 * 
 * Purpose: Automated data ingestion from MFAPI to MySQL for 10 major AMCs
 * Schedule: Daily at 2:00 AM IST (after MFAPI NAV updates at ~11:00 PM)
 * 
 * Usage:
 *   Full Sync (default):    node scripts/nightly-mfapi-sync.js
 *   Incremental Sync:       node scripts/nightly-mfapi-sync.js --incremental
 *   Dry Run:                node scripts/nightly-mfapi-sync.js --dry-run
 * 
 * Scheduling:
 *   Linux/Mac (crontab):    0 2 * * * /usr/bin/node /path/to/scripts/nightly-mfapi-sync.js
 *   Windows (Task Scheduler): Create task with trigger at 2:00 AM daily
 * 
 * Environment Variables Required:
 *   - DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
 *   - MFAPI_BASE_URL (optional, defaults to https://api.mfapi.in)
 *   - MFAPI_BATCH_SIZE (optional, defaults to 50)
 */

import 'dotenv/config.js';
import { mfapiIngestionService } from '../src/services/mfapiIngestion.service.js';
import { initializeDatabase } from '../src/db/database.js';

// Parse command line arguments
const args = process.argv.slice(2);
const isIncremental = args.includes('--incremental');
const isDryRun = args.includes('--dry-run');

// Console formatting helpers
const formatTimestamp = () => new Date().toISOString();
const logInfo = (msg) => console.log(`[${formatTimestamp()}] ℹ️  ${msg}`);
const logSuccess = (msg) => console.log(`[${formatTimestamp()}] ✅ ${msg}`);
const logError = (msg) => console.error(`[${formatTimestamp()}] ❌ ${msg}`);
const logWarning = (msg) => console.warn(`[${formatTimestamp()}] ⚠️  ${msg}`);

async function runSync() {
  const startTime = Date.now();
  let db;

  try {
    // Banner
    console.log('\n' + '='.repeat(80));
    console.log('  MFAPI NIGHTLY DATA INGESTION');
    console.log('  10 Major AMCs | Full Fund & NAV Sync');
    console.log('='.repeat(80) + '\n');

    // Display configuration
    logInfo(`Sync Type: ${isIncremental ? 'INCREMENTAL (NAV only)' : 'FULL (Funds + NAV)'}`);
    logInfo(`Dry Run: ${isDryRun ? 'YES (no changes will be made)' : 'NO'}`);
    logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logInfo(`Database: ${process.env.DB_HOST}:${process.env.DB_PORT || 3306}/${process.env.DB_NAME}`);
    
    if (isDryRun) {
      logWarning('DRY RUN MODE - No database changes will be made');
      console.log('\n' + '='.repeat(80) + '\n');
      logSuccess('Dry run completed - script would execute normally');
      return;
    }

    console.log('\n' + '-'.repeat(80) + '\n');

    // Step 1: Initialize database connection
    logInfo('Connecting to MySQL database...');
    db = await initializeDatabase();
    logSuccess('Database connection established');

    console.log('\n' + '-'.repeat(80) + '\n');

    // Step 2: Run appropriate sync
    let result;
    if (isIncremental) {
      logInfo('Starting INCREMENTAL sync (NAV updates only)...');
      result = await mfapiIngestionService.runIncrementalSync();
    } else {
      logInfo('Starting FULL sync (Funds + NAV data)...');
      logWarning('This may take 5-10 minutes depending on MFAPI response time');
      result = await mfapiIngestionService.runFullSync();
    }

    console.log('\n' + '-'.repeat(80) + '\n');

    // Step 3: Display results
    if (result.success) {
      logSuccess('Sync completed successfully!');
      console.log('\n📊 SYNC STATISTICS:');
      console.log('─'.repeat(80));
      
      if (!isIncremental) {
        console.log(`  Total Funds Fetched:      ${result.totalFetched || 0}`);
        console.log(`  Funds Inserted/Updated:   ${result.inserted || 0}`);
      }
      console.log(`  NAV Records Inserted:     ${result.navInserted || 0}`);
      console.log(`  Errors Encountered:       ${result.errors || 0}`);
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`  Execution Duration:       ${duration}s`);
      console.log('─'.repeat(80));

      // Display error summary if any
      if (result.errors > 0 && result.errorDetails && result.errorDetails.length > 0) {
        console.log('\n⚠️  ERROR SUMMARY (First 10):');
        console.log('─'.repeat(80));
        result.errorDetails.slice(0, 10).forEach((err, idx) => {
          console.log(`  ${idx + 1}. Scheme ${err.schemeCode}: ${err.error} (${err.step})`);
        });
        console.log('─'.repeat(80));
      }

      // Success exit
      console.log('\n' + '='.repeat(80));
      logSuccess('MFAPI ingestion completed - Database is up to date');
      console.log('='.repeat(80) + '\n');
      process.exit(0);

    } else {
      // Sync failed
      logError('Sync FAILED!');
      console.log('\n🚨 ERROR DETAILS:');
      console.log('─'.repeat(80));
      console.log(`  Error: ${result.error || 'Unknown error'}`);
      if (result.stack) {
        console.log(`  Stack: ${result.stack}`);
      }
      console.log('─'.repeat(80));

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`\n⏱️  Failed after ${duration}s`);
      
      console.log('\n' + '='.repeat(80));
      logError('MFAPI ingestion FAILED - Check logs above');
      console.log('='.repeat(80) + '\n');
      process.exit(1);
    }

  } catch (error) {
    // Unexpected error
    logError('Unexpected error occurred during sync!');
    console.error('\n🚨 EXCEPTION DETAILS:');
    console.error('─'.repeat(80));
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    console.error('─'.repeat(80));

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.error(`\n⏱️  Failed after ${duration}s`);
    
    console.log('\n' + '='.repeat(80));
    logError('MFAPI ingestion CRASHED - Check exception details above');
    console.log('='.repeat(80) + '\n');
    process.exit(1);

  } finally {
    // Step 4: Cleanup
    if (db) {
      try {
        await db.end();
        logInfo('Database connection closed');
      } catch (err) {
        logWarning(`Failed to close database connection: ${err.message}`);
      }
    }
  }
}

// Execute sync
runSync().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  console.error(error.stack);
  process.exit(1);
});
