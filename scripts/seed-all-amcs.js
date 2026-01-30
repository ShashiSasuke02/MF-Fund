/**
 * Migration: Seed All 12 Whitelisted AMCs
 * Adds the complete list of 12 whitelisted AMCs to amc_master table
 * Run: node scripts/seed-all-amcs.js
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// All 10 whitelisted AMCs
const ALL_AMCS = [
    { fundHouse: 'SBI Mutual Fund', displayName: 'SBI Mutual Fund', displayOrder: 1 },
    { fundHouse: 'ICICI Prudential Mutual Fund', displayName: 'ICICI Prudential Mutual Fund', displayOrder: 2 },
    { fundHouse: 'HDFC Mutual Fund', displayName: 'HDFC Mutual Fund', displayOrder: 3 },
    { fundHouse: 'Nippon India Mutual Fund', displayName: 'Nippon India Mutual Fund', displayOrder: 4 },
    { fundHouse: 'Kotak Mahindra Mutual Fund', displayName: 'Kotak Mahindra Mutual Fund', displayOrder: 5 },
    { fundHouse: 'Aditya Birla Sun Life Mutual Fund', displayName: 'Aditya Birla Sun Life Mutual Fund', displayOrder: 6 },
    { fundHouse: 'UTI Mutual Fund', displayName: 'UTI Mutual Fund', displayOrder: 7 },
    { fundHouse: 'Axis Mutual Fund', displayName: 'Axis Mutual Fund', displayOrder: 8 },
    { fundHouse: 'Tata Mutual Fund', displayName: 'Tata Mutual Fund', displayOrder: 9 },
    { fundHouse: 'Mirae Asset Mutual Fund', displayName: 'Mirae Asset Mutual Fund', displayOrder: 10 },
    { fundHouse: 'DSP Mutual Fund', displayName: 'DSP Mutual Fund', displayOrder: 11 },
    { fundHouse: 'Bandhan Mutual Fund', displayName: 'Bandhan Mutual Fund', displayOrder: 12 },
];

async function seedAMCs() {
    console.log('=== Seeding All 12 Whitelisted AMCs ===\n');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'mf_investments'
    });

    try {
        // Check existing AMCs
        const [existing] = await connection.execute('SELECT fund_house FROM amc_master');
        const existingHouses = new Set(existing.map(r => r.fund_house));

        console.log(`Existing AMCs in database: ${existingHouses.size}`);
        existingHouses.forEach(h => console.log(`  ✓ ${h}`));

        console.log('\n--- Adding missing AMCs ---\n');

        let inserted = 0;
        let skipped = 0;

        for (const amc of ALL_AMCS) {
            if (existingHouses.has(amc.fundHouse)) {
                console.log(`⏭️  Skipped: ${amc.fundHouse} (already exists)`);
                skipped++;
            } else {
                await connection.execute(
                    `INSERT INTO amc_master (fund_house, display_name, display_order) VALUES (?, ?, ?)`,
                    [amc.fundHouse, amc.displayName, amc.displayOrder]
                );
                console.log(`✅ Inserted: ${amc.fundHouse}`);
                inserted++;
            }
        }

        console.log('\n=== Summary ===');
        console.log(`Inserted: ${inserted}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Total AMCs now: ${existingHouses.size + inserted}`);

        // Verify final state
        const [final] = await connection.execute(
            'SELECT fund_house, display_name, display_order FROM amc_master ORDER BY display_order'
        );
        console.log('\n=== Current AMC List ===');
        final.forEach(amc => {
            console.log(`  ${amc.display_order}. ${amc.display_name}`);
        });

    } catch (error) {
        console.error('Error:', error.message);
        throw error;
    } finally {
        await connection.end();
    }
}

seedAMCs()
    .then(() => {
        console.log('\n✅ AMC seeding completed!');
        process.exit(0);
    })
    .catch((err) => {
        console.error('\n❌ AMC seeding failed:', err.message);
        process.exit(1);
    });
