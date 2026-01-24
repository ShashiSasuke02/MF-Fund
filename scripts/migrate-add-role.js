import { initializeDatabase, getDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function migrateAddRole() {
    console.log('[Migration] Starting role column migration...');

    try {
        await initializeDatabase();
        const db = getDatabase();

        // Check if column exists
        const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users' 
        AND COLUMN_NAME = 'role'
    `);

        if (columns.length === 0) {
            console.log('[Migration] Adding role column to users table...');
            await db.query(`
        ALTER TABLE users 
        ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'
      `);
            console.log('[Migration] ✅ Role column added successfully');
        } else {
            console.log('[Migration] Role column already exists');
        }

        // Update Admin User (ID 1)
        console.log('[Migration] Updating user ID 1 to admin role...');
        const [result] = await db.query(`
      UPDATE users 
      SET role = 'admin' 
      WHERE id = 1
    `);

        console.log(`[Migration] ✅ Updated ${result.affectedRows} user(s) to admin role`);

        // Verify
        const [admin] = await db.query('SELECT id, username, email_id, role FROM users WHERE id = 1');
        console.log('[Migration] Admin user verification:', admin[0]);

        if (!admin[0]) {
            console.warn('[Migration] ⚠️ Warning: User ID 1 not found. Please create a user first.');
        } else if (admin[0].role !== 'admin') {
            console.error('[Migration] ❌ Failed to set admin role!');
            process.exit(1);
        }

        process.exit(0);
    } catch (error) {
        console.error('[Migration] ❌ Migration failed:', error);
        process.exit(1);
    }
}

migrateAddRole();
