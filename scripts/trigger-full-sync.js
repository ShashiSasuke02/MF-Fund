
import 'dotenv/config';
import { mfapiIngestionService } from '../src/services/mfapiIngestion.service.js';
import { initializeDatabase } from '../src/db/database.js';

async function fullSync() {
    console.log('Starting Full Sync (Fetch New Funds + NAV + Categories)...');
    await initializeDatabase();

    await mfapiIngestionService.runFullSync();

    console.log('Full Sync Complete.');
    process.exit(0);
}

fullSync();
