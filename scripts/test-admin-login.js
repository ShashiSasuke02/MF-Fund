import { authController } from '../src/controllers/auth.controller.js';
import { userModel } from '../src/models/user.model.js';
import { initializeDatabase } from '../src/db/database.js';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

async function testAdminLogin() {
    console.log('[Test] Starting Admin Login Simulation...');

    try {
        await initializeDatabase();

        // 1. Fetch User
        const user = await userModel.findById(1);
        if (!user) {
            console.error('[Test] ❌ User ID 1 not found!');
            process.exit(1);
        }
        console.log(`[Test] User Found: ${user.username}, Role: ${user.role}`);

        if (user.role !== 'admin') {
            console.error('[Test] ❌ User is NOT admin in DB! Run migration first.');
            process.exit(1);
        }

        // 2. Generate Token (simulate what authController.login does)
        const token = jwt.sign(
            { userId: user.id, emailId: user.email_id, role: user.role || 'user' },
            JWT_SECRET,
            { expiresIn: '1h' }
        );
        console.log('[Test] Token Generated.');

        // 3. Decode Token to Verify Payload
        const decoded = jwt.decode(token);
        console.log('[Test] Decoded Token Payload:', JSON.stringify(decoded, null, 2));

        if (decoded.role === 'admin') {
            console.log('[Test] ✅ Token successfully contains "admin" role.');
        } else {
            console.log('[Test] ❌ Token MISSING "admin" role!');
        }

        process.exit(0);

    } catch (error) {
        console.error('[Test] Error:', error);
        process.exit(1);
    }
}

testAdminLogin();
