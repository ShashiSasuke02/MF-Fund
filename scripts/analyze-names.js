
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function analyzeNames() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('--- AMC Master Content ---');
        const [amcs] = await connection.query('SELECT fund_house, display_name FROM amc_master ORDER BY fund_house');
        console.table(amcs);

        console.log('\n--- Distinct Fund Houses in Funds Table ---');
        const [fundHouses] = await connection.query('SELECT DISTINCT fund_house FROM funds ORDER BY fund_house');
        console.table(fundHouses);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

analyzeNames();
