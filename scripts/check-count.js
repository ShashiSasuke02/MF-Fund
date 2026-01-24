
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkCount() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    const [rows] = await connection.query("SELECT COUNT(*) as count FROM funds WHERE fund_house LIKE '%HDFC%'");
    console.log(`HDFC Count in DB: ${rows[0].count}`);
    await connection.end();
}

checkCount();
