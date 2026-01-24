
import 'dotenv/config';
import { run, initializeDatabase } from '../src/db/database.js';

async function seedAMCs() {
    console.log('Seeding AMCs (Long Names Only)...');
    await initializeDatabase();

    // Clear existing to remove duplicates
    await run('DELETE FROM amc_master');

    const amcs = [
        ['SBI Mutual Fund', 'SBI Mutual Fund', 1, 'sbi.png'],
        ['ICICI Prudential Mutual Fund', 'ICICI Prudential Mutual Fund', 2, 'icici.png'],
        ['HDFC Mutual Fund', 'HDFC Mutual Fund', 3, 'hdfc.png'],
        ['Nippon India Mutual Fund', 'Nippon India Mutual Fund', 4, 'nippon.png'],
        ['Kotak Mahindra Mutual Fund', 'Kotak Mahindra Mutual Fund', 5, 'kotak.png'],
        ['Aditya Birla Sun Life Mutual Fund', 'Aditya Birla Sun Life Mutual Fund', 6, 'absl.png'],
        ['Axis Mutual Fund', 'Axis Mutual Fund', 7, 'axis.png'],
        ['UTI Mutual Fund', 'UTI Mutual Fund', 8, 'uti.png'],
        ['Mirae Asset Mutual Fund', 'Mirae Asset Mutual Fund', 9, 'mirae.png'],
        ['Tata Mutual Fund', 'Tata Mutual Fund', 10, 'tata.png']
    ];

    for (const [fundHouse, displayName, order, logo] of amcs) {
        await run(
            'INSERT INTO amc_master (fund_house, display_name, display_order, logo_url) VALUES (?, ?, ?, ?)',
            [fundHouse, displayName, order, `/amc-logos/${logo}`]
        );
        console.log(`Seeded: ${fundHouse}`);
    }

    console.log('Done.');
    process.exit(0);
}

seedAMCs();
