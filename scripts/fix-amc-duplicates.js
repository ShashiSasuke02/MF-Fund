
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function inspectAndclean() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        // 1. Check current state
        console.log('--- Current amc_master ---');
        const [rows] = await connection.query('SELECT fund_house FROM amc_master');
        console.table(rows);

        // 2. Check funds schema for FK
        console.log('\n--- Funds Table Constraints ---');
        const [constraints] = await connection.query(`
      SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'funds' AND REFERENCED_TABLE_NAME IS NOT NULL;
    `, [process.env.DB_NAME || 'mfselection']);
        console.table(constraints);

        // 3. Clean and Re-seed
        console.log('\n--- Cleaning & Re-seeding ---');
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE amc_master');

        // Insert Short Names (matching funds table)
        const amcs = [
            ['SBI', 'SBI Mutual Fund', 1],
            ['ICICI Prudential', 'ICICI Prudential Mutual Fund', 2],
            ['HDFC', 'HDFC Mutual Fund', 3],
            ['Nippon India', 'Nippon India Mutual Fund', 4],
            ['Kotak Mahindra', 'Kotak Mahindra Mutual Fund', 5],
            ['Aditya Birla Sun Life', 'Aditya Birla Sun Life Mutual Fund', 6],
            ['Axis', 'Axis Mutual Fund', 7],
            ['UTI', 'UTI Mutual Fund', 8],
            ['Mirae Asset', 'Mirae Asset Mutual Fund', 9],
            ['Tata', 'Tata Mutual Fund', 10]
        ];

        for (const [fundHouse, displayName, order] of amcs) {
            await connection.query(
                'INSERT INTO amc_master (fund_house, display_name, display_order) VALUES (?, ?, ?)',
                [fundHouse, displayName, order]
            );
        }
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('✅ amc_master cleaned and re-seeded successfully.');

        // 4. Verify
        const [finalRows] = await connection.query('SELECT fund_house, display_name FROM amc_master');
        console.table(finalRows);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

inspectAndclean();
