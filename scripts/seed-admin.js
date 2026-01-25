/**
 * Seed Admin User Script
 * Creates default admin user after fresh installation
 * 
 * Usage: node scripts/seed-admin.js
 */

import bcrypt from 'bcrypt';
import db from '../src/db/database.js';

const ADMIN_CONFIG = {
    full_name: 'Shashidhar Belavanki',
    email_id: 'itsshashidharbelavanki@gmail.com',
    username: 'admin',
    password: 'Naruto@02',
    role: 'admin'
};

async function seedAdmin() {
    try {
        console.log('[Seed Admin] Starting admin user creation...');

        // Check if admin already exists
        const existingUser = await db.queryOne(
            'SELECT id FROM users WHERE username = ? OR email_id = ?',
            [ADMIN_CONFIG.username, ADMIN_CONFIG.email_id]
        );

        if (existingUser) {
            console.log('[Seed Admin] Admin user already exists. Skipping...');
            return { success: true, message: 'Admin already exists', userId: existingUser.id };
        }

        // Hash password
        const passwordHash = await bcrypt.hash(ADMIN_CONFIG.password, 10);
        const now = Date.now();

        // Insert admin user
        const result = await db.run(
            `INSERT INTO users (full_name, email_id, username, password_hash, role, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                ADMIN_CONFIG.full_name,
                ADMIN_CONFIG.email_id,
                ADMIN_CONFIG.username,
                passwordHash,
                ADMIN_CONFIG.role,
                now,
                now
            ]
        );

        const userId = result.insertId;
        console.log(`[Seed Admin] Admin user created with ID: ${userId}`);

        // Create demo account for admin (1 Crore balance)
        await db.run(
            `INSERT INTO demo_accounts (user_id, balance, created_at, updated_at)
       VALUES (?, ?, ?, ?)`,
            [userId, 10000000.00, now, now]
        );

        console.log('[Seed Admin] Demo account created with ₹1 Crore balance');
        console.log('[Seed Admin] ✅ Admin setup complete!');
        console.log('[Seed Admin] Login credentials:');
        console.log(`  Username: ${ADMIN_CONFIG.username}`);
        console.log(`  Password: ${ADMIN_CONFIG.password}`);

        return { success: true, userId };

    } catch (error) {
        console.error('[Seed Admin] Failed to create admin:', error.message);
        return { success: false, error: error.message };
    }
}

// Run if called directly
seedAdmin()
    .then(result => {
        console.log('[Seed Admin] Result:', result);
        process.exit(result.success ? 0 : 1);
    })
    .catch(err => {
        console.error('[Seed Admin] Fatal error:', err);
        process.exit(1);
    });

export { seedAdmin };
