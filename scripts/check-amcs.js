
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkAMCs() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('Checking AMC Master...');
        const [rows] = await connection.query('SELECT * FROM amc_master');
        console.table(rows);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkAMCs();
