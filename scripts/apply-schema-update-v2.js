import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mfselection'
};

async function applySchemaUpdate() {
    console.log('🚀 Starting Schema Update v2...');
    let connection;

    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database.');

        // 1. Add investment_objective column
        try {
            await connection.query(`
                ALTER TABLE funds 
                ADD COLUMN investment_objective TEXT DEFAULT NULL AFTER fund_manager
            `);
            console.log('✅ Added column: investment_objective');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ Column investment_objective already exists. Skipping.');
            } else {
                throw error;
            }
        }

        // 2. Add fund_start_date column
        try {
            await connection.query(`
                ALTER TABLE funds 
                ADD COLUMN fund_start_date DATE DEFAULT NULL AFTER investment_objective
            `);
            console.log('✅ Added column: fund_start_date');
        } catch (error) {
            if (error.code === 'ER_DUP_FIELDNAME') {
                console.log('ℹ️ Column fund_start_date already exists. Skipping.');
            } else {
                throw error;
            }
        }

        console.log('🎉 Schema update completed successfully!');

    } catch (error) {
        console.error('❌ Schema update failed:', error.message);
    } finally {
        if (connection) await connection.end();
    }
}

applySchemaUpdate();
