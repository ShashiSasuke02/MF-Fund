
import 'dotenv/config'; // Load environment variables!
import { run, initializeDatabase } from '../src/db/database.js';

// Migration to add pending_registrations table
async function migrate() {
    console.log('Starting migration: add pending_registrations table...');
    try {
        await initializeDatabase();
        await run(`
            CREATE TABLE IF NOT EXISTS pending_registrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                full_name VARCHAR(255) NOT NULL,
                email_id VARCHAR(255) NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                otp_hash VARCHAR(255) NOT NULL,
                otp_attempts INT DEFAULT 0,
                expires_at BIGINT NOT NULL,
                created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
                INDEX idx_pending_email (email_id),
                INDEX idx_pending_expires (expires_at)
            );
        `);
        console.log('Migration completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrate();
