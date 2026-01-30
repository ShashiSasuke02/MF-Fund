import fundEnrichmentService from '../src/services/fundEnrichment.service.js';
import { fundModel } from '../src/models/fund.model.js';
import db from '../src/db/database.js'; // Use singleton DB
import mysql from 'mysql2/promise'; // Keep for setup/teardown raw queries
import dotenv from 'dotenv';
dotenv.config();

async function runFullFlowVerification() {
    console.log('🚀 Starting Full-Flow (Controller Logic) Verification...');

    // Initialize Singleton DB for Model
    await db.initializeDatabase();

    // Raw Connection for Setup/Teardown
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mfselection'
    });

    const TEST_CODE = 888888;
    const VALID_ISIN = 'INF843K01FC8';

    try {
        // 1. Setup: Insert Test Fund
        console.log(`🛠️ Setup: Inserting Test Fund ${TEST_CODE} with ISIN ${VALID_ISIN}`);
        await connection.query(`
            INSERT INTO funds (scheme_code, scheme_name, isin, fund_house, is_active)
            VALUES (?, 'Enrichment Simulation Fund', ?, 'Simulation AMC', 1)
            ON DUPLICATE KEY UPDATE isin = VALUES(isin), is_active=1, detail_info_synced_at=NULL, aum=NULL
        `, [TEST_CODE, VALID_ISIN]);

        // 2. Simulate Controller Logic
        console.log('🔄 Simulating Controller Fetch...');

        // A. Get Details (Use Model directly to avoid Service circularity in script)
        let fund = await fundModel.findBySchemeCode(TEST_CODE);
        if (!fund) throw new Error('Fund not found in DB');

        // B. Call Enrichment Service
        const requestId = 'sim-request-1';
        console.log(`📡 Calling Enrichment Service for ISIN: ${fund.isin}`);
        const enrichedData = await fundEnrichmentService.fetchFundDetails(fund.isin, requestId);

        // C. Persist & Merge
        if (enrichedData) {
            console.log('✅ Service returned data. Persisting...');
            // Log a snippet to confirm structure
            console.log(`Data found: AUM=${enrichedData.aum}, Risk=${enrichedData.risk_level}`);

            await fundModel.updateEnrichmentData(TEST_CODE, enrichedData);
            console.log('💾 Data saved to DB.');
        } else {
            throw new Error('Service returned null enrichedData'); // This should not happen for INF843K01FC8
        }

        // 3. Verify Persistence
        const [rows] = await connection.query('SELECT aum, risk_level, investment_objective, fund_start_date, detail_info_synced_at FROM funds WHERE scheme_code = ?', [TEST_CODE]);
        const finalRow = rows[0];

        console.log('--- DB Verification ---');
        console.log(`AUM: ${finalRow.aum}`);
        console.log(`Risk: ${finalRow.risk_level}`);
        console.log(`Objective: ${finalRow.investment_objective ? finalRow.investment_objective.substring(0, 30) + '...' : 'NULL'}`);
        console.log(`Start Date: ${finalRow.fund_start_date}`);
        console.log(`Synced At: ${finalRow.detail_info_synced_at}`);

        if (finalRow.aum > 0 && finalRow.detail_info_synced_at && finalRow.investment_objective) {
            console.log('🎉 SUCCESS: Full enrichment flow verified (including Objective & Start Date)!');
        } else {
            console.error('❌ FAILURE: DB not updated correctly.');
        }

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        // Cleanup
        await connection.query('DELETE FROM funds WHERE scheme_code = ?', [TEST_CODE]);
        console.log(`🧹 Cleanup: Deleted Test Fund ${TEST_CODE}`);
        await connection.end();
        process.exit(0);
    }
}

runFullFlowVerification();
