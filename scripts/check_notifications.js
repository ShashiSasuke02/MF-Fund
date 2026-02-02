import 'dotenv/config';
import { query, initializeDatabase, closeDatabase } from '../src/db/database.js';

async function run() {
    try {
        // Check if we need to force DB_HOST for local run if .env has docker hostname
        if (process.env.DB_HOST === 'mysql') {
            process.env.DB_HOST = '127.0.0.1'; // Force localhost if needed
            console.log('ℹ️ Overriding DB_HOST to 127.0.0.1 for local check');
        }

        await initializeDatabase(1, 1000);
        console.log('🔍 Checking latest notifications for User ID 1...');
        const rows = await query('SELECT id, title, type, is_read, created_at FROM user_notifications WHERE user_id=1 ORDER BY created_at DESC LIMIT 5');
        console.log(JSON.stringify(rows, null, 2));
        await closeDatabase();
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}
run();
