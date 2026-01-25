
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixAmcNames() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('--- Updating AMC Names ---');

        // Fix IDFC -> Bandhan
        const [idfc] = await connection.execute('SELECT * FROM amc_master WHERE fund_house LIKE "%IDFC%"');
        if (idfc.length > 0) {
            console.log('Found IDFC Mutual Fund. Renaming to Bandhan Mutual Fund...');
            await connection.execute('UPDATE amc_master SET fund_house = ?, display_name = ? WHERE fund_house LIKE "%IDFC%"',
                ['Bandhan Mutual Fund', 'Bandhan Mutual Fund']);
            console.log('Renamed IDFC to Bandhan.');
        } else {
            console.log('IDFC Mutual Fund query returned no results (might already be Bandhan). checking Bandhan...');
            const [bandhan] = await connection.execute('SELECT * FROM amc_master WHERE fund_house LIKE "%Bandhan%"');
            if (bandhan.length === 0) {
                // Insert Bandhan if neither exists? 
                // User said "IDFC Mutual Fund" shows zero, so it probably exists as IDFC or was IDFC.
                // If the script finds nothing, maybe the user sees it in cache? Unlikely.
                // Let's assume we might need to insert it if missing.
                console.log('Bandhan Mutual Fund not found either. Inserting...');
                await connection.execute(`INSERT IGNORE INTO amc_master (fund_house, display_name, display_order) VALUES ('Bandhan Mutual Fund', 'Bandhan Mutual Fund', 10)`);
            }
        }

        // Ensure DSP exists
        const [dsp] = await connection.execute('SELECT * FROM amc_master WHERE fund_house LIKE "%DSP%"');
        if (dsp.length === 0) {
            console.log('DSP Mutual Fund not found in amc_master. Inserting...');
            await connection.execute(`INSERT IGNORE INTO amc_master (fund_house, display_name, display_order) VALUES ('DSP Mutual Fund', 'DSP Mutual Fund', 11)`);
        } else {
            console.log('DSP Mutual Fund exists.');
        }

        console.log('--- Database Update Complete ---');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}

fixAmcNames();
