
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkData() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [amcs] = await connection.execute('SELECT * FROM amc_master');
        console.log('AMCs in DB:', amcs.map(a => a.fund_house));

        console.log('--- Checking Funds Table ---');
        try {
            const [schemes] = await connection.execute('SELECT fund_house, COUNT(*) as count FROM funds WHERE fund_house LIKE "%DSP%" OR fund_house LIKE "%Bandhan%" GROUP BY fund_house');
            console.log('Target Scheme counts:', schemes);
        } catch (e) {
            console.log('Error querying funds table:', e.message);
        }

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

checkData();
