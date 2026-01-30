import { query, initializeDatabase } from '../src/db/database.js';
import 'dotenv/config';

async function resetSync() {
    try {
        await initializeDatabase();
        await query("UPDATE funds SET detail_info_synced_at = NULL WHERE isin = 'INF200K01SZ5'");
        console.log('✅ Specific Fund Sync Flag Cleared for INF200K01SZ5');
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

resetSync();
