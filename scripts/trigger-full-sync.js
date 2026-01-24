
import 'dotenv/config';
import { mfapiIngestionService } from '../src/services/mfapiIngestion.service.js';
import { initializeDatabase } from '../src/db/database.js';
import { seedAMCs } from './seed-amcs.js';

async function fullSync() {
    console.log('Starting Full Sync Job...');

    // 1. Initialize DB
    await initializeDatabase();

    // 2. Seed AMCs (Critical for mapping funds)
    await seedAMCs(false); // false = don't exit process

    // 3. Fetch Funds
    console.log('Fetching New Funds + NAV + Categories...');
    await mfapiIngestionService.runFullSync();

    console.log('Full Sync Complete.');
    process.exit(0);
}

fullSync();
