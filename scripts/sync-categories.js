
import 'dotenv/config';
import { mfapiIngestionService } from '../src/services/mfapiIngestion.service.js';
import { initializeDatabase } from '../src/db/database.js';

async function syncCategories() {
    console.log('Starting Manual Category Sync...');
    await initializeDatabase();

    // We'll run the incremental sync, which fetches NAVs for all active funds.
    // Since we modified batchFetchNavs, this will also update categories.
    await mfapiIngestionService.runIncrementalSync();

    console.log('Sync Complete.');
    process.exit(0);
}

syncCategories();
