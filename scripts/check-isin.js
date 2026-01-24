
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkISIN() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        // Count funds with ISIN
        const [validISIN] = await connection.query('SELECT COUNT(*) as count FROM funds WHERE isin IS NOT NULL AND isin != ""');
        console.log(`Funds with Valid ISIN: ${validISIN[0].count}`);

        const [nullISIN] = await connection.query('SELECT COUNT(*) as count FROM funds WHERE isin IS NULL OR isin = ""');
        console.log(`Funds with NULL/Empty ISIN: ${nullISIN[0].count}`);

        // Check a sample
        const [sample] = await connection.query('SELECT scheme_code, scheme_name, isin FROM funds LIMIT 5');
        console.table(sample);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkISIN();
