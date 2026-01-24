import { initializeDatabase, getDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUserSchema() {
    try {
        console.log('[Debug] Checking User Schema...');
        await initializeDatabase();
        const db = getDatabase();

        // 1. Check schemas
        const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'users'
    `);

        if (columns.length === 0) {
            console.log('User table not found or empty schema info.');
            // Try listing tables
            const [tables] = await db.query('SHOW TABLES');
            console.log('Tables:', tables);
            process.exit(1);
        }

        const colNames = columns.map(c => c.COLUMN_NAME);
        console.log('User Columns:', colNames.join(', '));

        // Construct safe query
        const safeCols = ['id'];
        if (colNames.includes('username')) safeCols.push('username');
        if (colNames.includes('full_name')) safeCols.push('full_name');
        if (colNames.includes('email_id')) safeCols.push('email_id');
        if (colNames.includes('email')) safeCols.push('email');
        if (colNames.includes('role')) safeCols.push('role');

        console.log(`Running query: SELECT ${safeCols.join(', ')} FROM users`);
        const [users] = await db.query(`SELECT ${safeCols.join(', ')} FROM users`);

        console.log(`Found ${users.length} users:`);
        console.log(users);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUserSchema();
