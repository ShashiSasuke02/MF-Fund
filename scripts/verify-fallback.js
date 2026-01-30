import axios from 'axios';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://127.0.0.1:4000/api';
const DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'mf_selection'
};

async function verifyFallback() {
    console.log('🚀 Starting Fallback Verification...');
    const connection = await mysql.createConnection(DB_CONFIG);

    const PEER_CODE = 999001;
    const TARGET_CODE = 999002;
    const BASE_NAME = 'Test Fallback Fund';

    try {
        // 1. Setup Test Data
        console.log('🛠️ Setup: Inserting Test Funds...');

        // Peer Fund (Growth) - HAS DATA
        await connection.query(`
            INSERT INTO funds (scheme_code, scheme_name, scheme_category, fund_house, aum, risk_level, investment_objective, is_active)
            VALUES (?, ?, 'Equity', 'Test AMC', 1000.50, 'Very High', 'To test fallback logic', 1)
            ON DUPLICATE KEY UPDATE aum=1000.50, risk_level='Very High', investment_objective='To test fallback logic'
        `, [PEER_CODE, `${BASE_NAME} - Growth`]);

        // Target Fund (IDCW) - NO DATA
        await connection.query(`
            INSERT INTO funds (scheme_code, scheme_name, scheme_category, fund_house, aum, risk_level, investment_objective, is_active)
            VALUES (?, ?, 'Equity', 'Test AMC', NULL, NULL, NULL, 1)
            ON DUPLICATE KEY UPDATE aum=NULL, risk_level=NULL, investment_objective=NULL
        `, [TARGET_CODE, `${BASE_NAME} - IDCW`]);

        // 2. Clear Sync Flag for Target (ensure it tries fallback)
        await connection.query('UPDATE funds SET detail_info_synced_at = NULL WHERE scheme_code = ?', [TARGET_CODE]);

        // 3. Hit API
        console.log(`📡 Fetching Target Fund ${TARGET_CODE}...`);
        const response = await axios.get(`${BASE_URL}/funds/${TARGET_CODE}`);
        const data = response.data.data.meta;

        // 4. Assert
        console.log('--- API Response Metadata ---');
        console.log(`Name: ${data.scheme_name}`);
        console.log(`AUM: ${data.aum}`);
        console.log(`Risk: ${data.risk_level}`);
        console.log(`Objective: ${data.investment_objective}`);
        console.log(`Source Type: ${data.data_source_type}`);

        if (data.aum === 1000.50 && data.risk_level === 'Very High' && data.data_source_type === 'PEER_FALLBACK') {
            console.log('🎉 SUCCESS: Target fund successfully borrowed data from Peer!');
        } else {
            console.error('❌ FAILURE: Data mismatch or fallback not triggered.');
            console.error('Expected AUM: 1000.50, Got:', data.aum);
            console.error('Expected Source: PEER_FALLBACK, Got:', data.data_source_type);
            process.exit(1);
        }

    } catch (e) {
        console.error('❌ Error during test:');
        console.error(e.message);
        if (e.response) {
            console.error('API Status:', e.response.status);
            console.error('API Data:', JSON.stringify(e.response.data, null, 2));
        } else {
            console.error(e);
        }
        process.exit(1);
    } finally {
        // Cleanup
        console.log('🧹 Cleanup: Deleting Test Funds...');
        await connection.query('DELETE FROM funds WHERE scheme_code IN (?, ?)', [PEER_CODE, TARGET_CODE]);
        await connection.end();
        process.exit(0);
    }
}

verifyFallback();
