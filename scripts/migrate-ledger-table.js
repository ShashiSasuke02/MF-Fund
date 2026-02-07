/**
 * Migration Script: Create Ledger Entries Table
 * 
 * This script creates the `ledger_entries` table if it does not exist.
 * Run this on existing deployments where the table is missing.
 * 
 * Usage: node scripts/migrate-ledger-table.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function createConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });
}

async function migrate() {
    let connection = null;
    try {
        console.log('🔌 Connecting to database...');
        connection = await createConnection();
        console.log('✅ Connected.');

        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ledger_entries (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                transaction_id INT,
                amount DECIMAL(15,2) NOT NULL,
                balance_after DECIMAL(15,2) NOT NULL,
                type ENUM('CREDIT', 'DEBIT') NOT NULL,
                description VARCHAR(255) NOT NULL,
                created_at BIGINT NOT NULL DEFAULT (UNIX_TIMESTAMP() * 1000),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL,
                INDEX idx_ledger_user (user_id),
                INDEX idx_ledger_created (created_at)
            )
        `;

        console.log('🛠️  Creating ledger_entries table...');
        await connection.execute(createTableSQL);
        console.log('✅ Table `ledger_entries` created (or already exists).');

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Disconnected.');
        }
    }
}

migrate();
