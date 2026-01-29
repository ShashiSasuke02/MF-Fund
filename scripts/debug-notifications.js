
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function debugNotifications() {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME || 'mutual_funds'
        });

        console.log('Connected to database.');

        const [rows] = await connection.execute('SELECT * FROM user_notifications ORDER BY created_at DESC LIMIT 5');
        console.log('Recent Notifications:', rows);

        if (rows.length > 0) {
            console.log('is_read type:', typeof rows[0].is_read);
            console.log('is_read value:', rows[0].is_read);
        } else {
            console.log('No notifications found.');
        }

        // Check if table exists
        const [tables] = await connection.execute('SHOW TABLES LIKE "user_notifications"');
        console.log('Table user_notifications exists:', tables.length > 0);

        await connection.end();
    } catch (error) {
        console.error('Error:', error);
    }
}

debugNotifications();
