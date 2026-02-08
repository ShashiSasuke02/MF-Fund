
import dotenv from 'dotenv';
dotenv.config();

const SCHEME_NAME_FULL = "ICICI Prudential Bharat Consumption Fund - Growth Option";

async function verifyPeerSearch() {
    // Dynamic import to respect dotenv
    const db = (await import('../src/db/database.js')).default;

    console.log(`\n--- Peer Search Verification ---`);
    console.log(`Input Name: "${SCHEME_NAME_FULL}"`);

    // 1. Extract Base Name
    const baseName = SCHEME_NAME_FULL.split(' - ')[0].trim();
    console.log(`\nDerived Base Name: "${baseName}"`);

    // 2. Search for all potential peers (loose match first)
    console.log(`\nSearching for ALL funds starting with Base Name: "${baseName}%"`);

    // Use raw query for verification
    const selectAllQuery = `
        SELECT scheme_code, scheme_name, aum, expense_ratio
        FROM funds 
        WHERE scheme_name LIKE ?
        ORDER BY scheme_name ASC
    `;
    const allMatches = await db.query(selectAllQuery, [`${baseName}%`]);

    if (allMatches.length === 0) {
        console.log("❌ No funds found matching base name.");
    } else {
        console.log(`✅ Found ${allMatches.length} matching funds:`);
        allMatches.forEach(f => {
            console.log(`   - [${f.scheme_code}] ${f.scheme_name} (AUM: ${f.aum || 'N/A'})`);
        });
    }

    // 3. Verify Strict Logic (Base Name - % + Direct + Growth)
    console.log(`\n--- Applying Fallback Logic ---`);
    console.log(`Criteria: Starts with "${baseName} - " AND contains "Direct Plan" AND "Growth"`);

    const strictQuery = `
        SELECT * FROM funds 
        WHERE scheme_name LIKE ? 
        AND scheme_name LIKE '%Direct Plan%'
        AND scheme_name LIKE '%Growth%'
        AND aum IS NOT NULL 
        AND aum > 0
        LIMIT 1
    `;

    const pickedPeer = await db.queryOne(strictQuery, [`${baseName} - %`]);

    if (pickedPeer) {
        console.log(`\n✅ SELECTED PEER:`);
        console.log(`   Name: ${pickedPeer.scheme_name}`);
        console.log(`   Code: ${pickedPeer.scheme_code}`);
        console.log(`   AUM:  ${pickedPeer.aum}`);
    } else {
        console.log(`\n⚠️ NO PEER SELECTED (Strict match failed)`);
        console.log(`   Expected to find: "${baseName} - Direct Plan - Growth" (or similar)`);
    }

    process.exit(0);
}

verifyPeerSearch().catch(err => {
    console.error(err);
    process.exit(1);
});
