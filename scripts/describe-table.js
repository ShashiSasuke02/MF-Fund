
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function describeTable() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('--- Columns of fund_nav_history ---');
        const [rows] = await connection.query('DESCRIBE fund_nav_history');
        rows.forEach(col => console.log(col.Field));

        console.log('\n--- Columns of funds ---');
        const [fundRows] = await connection.query('DESCRIBE funds');
        fundRows.forEach(col => console.log(col.Field));

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

describeTable();
