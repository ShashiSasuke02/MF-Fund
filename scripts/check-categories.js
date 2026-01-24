
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkCategories() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    try {
        console.log('Checking scheme categories...');

        // Count of funds with null/empty category
        const [nullCat] = await connection.query('SELECT COUNT(*) as count FROM funds WHERE scheme_category IS NULL OR scheme_category = ""');
        console.log(`Funds with NULL/Empty category: ${nullCat[0].count}`);

        // Count of funds WITH category
        const [validCat] = await connection.query('SELECT COUNT(*) as count FROM funds WHERE scheme_category IS NOT NULL AND scheme_category != ""');
        console.log(`Funds with Valid category: ${validCat[0].count}`);

        // List distinct categories (limit 10)
        const [categories] = await connection.query('SELECT DISTINCT scheme_category FROM funds WHERE scheme_category IS NOT NULL AND scheme_category != "" LIMIT 10');
        console.log('Sample Categories:');
        console.table(categories);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await connection.end();
    }
}

checkCategories();
