import 'dotenv/config';
import { query, initializeDatabase } from '../src/db/database.js';

async function checkData() {
    try {
        await initializeDatabase();
        const results = await query("SELECT scheme_code, scheme_name, isin, aum, detail_info_synced_at FROM funds WHERE scheme_name LIKE 'ICICI Prudential All Seasons Bond Fund%' AND aum IS NOT NULL");
        console.log(JSON.stringify(results, null, 2));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkData();
