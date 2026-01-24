
import mysql from 'mysql2/promise';
// Native fetch in Node 18+
import dotenv from 'dotenv';
dotenv.config();

async function findMissing() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('Fetching API funds...');
        const response = await fetch('https://api.mfapi.in/mf');
        const allFunds = await response.json();

        const apiHdfc = allFunds.filter(f => f.schemeName.toLowerCase().includes('hdfc'));
        console.log(`API HDFC Count: ${apiHdfc.length}`);

        console.log('Fetching DB funds...');
        const [rows] = await connection.query('SELECT scheme_code FROM funds');
        const dbCodes = new Set(rows.map(r => String(r.scheme_code)));

        const missing = apiHdfc.filter(f => !dbCodes.has(String(f.schemeCode)));

        console.log(`Missing HDFC Funds: ${missing.length}`);

        if (missing.length > 0) {
            console.log('First 10 Missing Funds:');
            missing.slice(0, 10).forEach(f => console.log(`- ${f.schemeName} (${f.schemeCode})`));

            console.log('\nLast 10 Missing Funds:');
            missing.slice(-10).forEach(f => console.log(`- ${f.schemeName} (${f.schemeCode})`));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

findMissing();
