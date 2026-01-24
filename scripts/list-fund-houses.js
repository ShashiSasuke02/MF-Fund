
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function listFundHouses() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('--- Distinct Fund Houses in `funds` table ---');
        const [rows] = await connection.query('SELECT DISTINCT fund_house FROM funds ORDER BY fund_house');
        rows.forEach(r => console.log(`'${r.fund_house}'`));

        console.log('\n--- AMC Master Table ---');
        const [master] = await connection.query('SELECT fund_house, display_name FROM amc_master');
        console.table(master);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

listFundHouses();
