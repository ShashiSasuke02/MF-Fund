import 'dotenv/config';
import { query, initializeDatabase, closeDatabase } from '../src/db/database.js';
import { notificationModel } from '../src/models/notification.model.js';
import { getISTDate } from '../src/utils/date.utils.js';

// Helper for date formatting in messages (mirrors scheduler.service.js)
const formatDateForMsg = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric'
    });
};

async function run() {
    try {
        console.log('🔌 Connecting to database...');
        // Initialize DB connection (creates pool)
        await initializeDatabase(1, 1000);

        console.log('🔍 Searching for Admin user...');

        // 1. Find Admin User
        const users = await query("SELECT id, email_id FROM users WHERE role = 'admin' LIMIT 1");

        // Fallback: If no 'admin' role, try finding user with email containing 'admin'
        let adminUser;
        if (users.length > 0) {
            adminUser = users[0];
        } else {
            console.log('⚠️ No user with role="admin" found. Trying email match...');
            const emailUsers = await query("SELECT id, email_id FROM users WHERE email_id LIKE '%admin%' LIMIT 1");
            if (emailUsers.length > 0) {
                adminUser = emailUsers[0];
            } else {
                // Ultimate fallback: Just pick the first user
                console.log('⚠️ No admin-like user found. Picking the first available user...');
                const anyUsers = await query("SELECT id, email_id FROM users LIMIT 1");
                if (anyUsers.length === 0) {
                    console.error('❌ No users found in database!');
                    process.exit(1);
                }
                adminUser = anyUsers[0];
            }
        }

        console.log(`✅ Target User: ${adminUser.email_id} (ID: ${adminUser.id})`);

        const todayDate = getISTDate();
        const formattedDate = formatDateForMsg(todayDate);

        // 2. Create SIP Success Notification
        console.log('🔔 Pushing SIP Notification...');
        await notificationModel.create({
            userId: adminUser.id,
            title: 'Wealth Builder Alert 🚀',
            message: `✅ Wealth Builder Alert! Your SIP for SBI Bluechip Fund of ₹5000 was successful. Next installment: ${formattedDate}. (TEST ALERT - MANUAL TRIGGER)`,
            type: 'SUCCESS'
        });

        // 3. Create SWP Success Notification
        console.log('🔔 Pushing SWP Notification...');
        await notificationModel.create({
            userId: adminUser.id,
            title: 'Passive Income Alert! 🎉',
            message: `High Five! Your SWP from HDFC Mid-Cap executed successfully. ₹2500 has been credited to your balance. Next installment: ${formattedDate}. (TEST ALERT - MANUAL TRIGGER)`,
            type: 'SUCCESS'
        });

        console.log('✨ Done! Notifications pushed successfully.');
        await closeDatabase();
        process.exit(0);
    } catch (error) {
        console.error('❌ Error executing script:', error);
        await closeDatabase().catch(() => { });
        process.exit(1);
    }
}

run();
