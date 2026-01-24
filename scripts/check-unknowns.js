
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkUnknowns() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        // Count 'Unknown' fund houses
        const [unknowns] = await connection.query("SELECT COUNT(*) as count FROM funds WHERE fund_house = 'Unknown' OR fund_house IS NULL");
        console.log(`Unknown Fund Houses: ${unknowns[0].count}`);

        // See if any contain 'HDFC' in name
        const [missedHdfc] = await connection.query("SELECT scheme_code, scheme_name, fund_house FROM funds WHERE (fund_house = 'Unknown' OR fund_house IS NULL) AND scheme_name LIKE '%HDFC%' LIMIT 20");

        if (missedHdfc.length > 0) {
            console.log('Found HDFC schemes marked as Unknown:');
            console.table(missedHdfc);
        } else {
            console.log('No HDFC schemes found in Unknown bucket.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkUnknowns();
