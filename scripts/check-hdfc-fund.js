
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSpecificFund() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        const [rows] = await connection.query('SELECT * FROM funds WHERE scheme_code = 100119');
        if (rows.length > 0) {
            console.log('Found Fund 100119:');
            console.table(rows);
        } else {
            console.log('Fund 100119 NOT FOUND in database.');
        }

        // Check count again
        const [count] = await connection.query("SELECT COUNT(*) as count FROM funds WHERE fund_house LIKE '%HDFC%'");
        console.log(`Total HDFC funds in DB: ${count[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkSpecificFund();
