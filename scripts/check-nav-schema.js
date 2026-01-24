
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        const [columns] = await connection.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'fund_nav_history'
    `, [process.env.DB_NAME || 'mfselection']);

        console.log('Columns in fund_nav_history:');
        console.table(columns);

        // Also check one record to see data
        const [rows] = await connection.query('SELECT * FROM fund_nav_history LIMIT 1');
        console.log('Sample Row:', rows[0]);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
