
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const SCHEME_NAME_FULL = "ICICI Prudential Bharat Consumption Fund - Growth Option";

async function run() {
    console.log(`\n=== RAW PEER LOOKUP VERIFICATION ===`);

    // Connect to DB directly
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'mf_portfolio'
    });

    try {
        const baseName = SCHEME_NAME_FULL.split(' - ')[0].trim();
        console.log(`Base Name: "${baseName}"`);

        // 1. Show ALL funds starting with Base Name
        console.log(`\n--- ALL MATCHES (${baseName}%) ---`);
        const [rows] = await connection.execute(
            `SELECT scheme_code, scheme_name, aum FROM funds WHERE scheme_name LIKE ? ORDER BY scheme_name`,
            [`${baseName}%`]
        );

        rows.forEach(r => {
            console.log(`[${r.scheme_code}] ${r.scheme_name} (AUM: ${r.aum})`);
        });

        if (rows.length === 0) console.log("(No matches found)");

        // 2. Run STRICT Logic
        console.log(`\n--- STRICT PEER LOGIC ---`);
        const query = `
            SELECT * FROM funds 
            WHERE scheme_name LIKE ? 
            AND scheme_name LIKE '%Direct Plan%'
            AND scheme_name LIKE '%Growth%'
            LIMIT 1
        `;
        const [peers] = await connection.execute(query, [`${baseName} - %`]);

        if (peers.length > 0) {
            const peer = peers[0];
            console.log(`✅ MATCH FOUND BY NAME: ${peer.scheme_name} (Code: ${peer.scheme_code})`);
            console.log(`   Data Status: AUM=${peer.aum}, Expense=${peer.expense_ratio}`);

            if (!peer.aum) {
                console.log(`⚠️ NOTE: Peer found but has NO data (AUM is null). In production, this would be skipped to avoid merging empty data.`);
            }
        } else {
            console.log(`❌ NO PEER FOUND even with relaxed data checks.`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await connection.end();
    }
}

run();
