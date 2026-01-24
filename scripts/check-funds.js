
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkFunds() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('Checking fund counts...');

        // Total funds
        const [total] = await connection.query('SELECT COUNT(*) as count FROM funds');
        console.log(`Total Funds: ${total[0].count}`);

        // Active funds
        const [active] = await connection.query('SELECT COUNT(*) as count FROM funds WHERE is_active = 1');
        console.log(`Active Funds: ${active[0].count}`);

        // Funds by AMC (Limit 5)
        const [amcs] = await connection.query('SELECT fund_house, COUNT(*) as count FROM funds GROUP BY fund_house ORDER BY count DESC LIMIT 5');
        console.table(amcs);

        // Check specific fund houses from previous error logs
        const [kotak] = await connection.query("SELECT COUNT(*) as count FROM funds WHERE fund_house LIKE '%Kotak%'");
        console.log(`Kotak Funds: ${kotak[0].count}`);

        const [axis] = await connection.query("SELECT COUNT(*) as count FROM funds WHERE fund_house LIKE '%Axis%'");
        console.log(`Axis Funds: ${axis[0].count}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkFunds();
