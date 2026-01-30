
import 'dotenv/config';
import { run, initializeDatabase } from '../src/db/database.js';

export async function seedAMCs(shouldExit = false) {
    console.log('Seeding AMCs (Short Names for Keys)...');
    try {
        await initializeDatabase();

        // Clear existing to remove duplicates
        await run('DELETE FROM amc_master');

        const amcs = [
            ['SBI', 'SBI Mutual Fund', 1, 'sbi.png'],
            ['ICICI Prudential', 'ICICI Prudential Mutual Fund', 2, 'icici.png'],
            ['HDFC', 'HDFC Mutual Fund', 3, 'hdfc.png'],
            ['Nippon India', 'Nippon India Mutual Fund', 4, 'nippon.png'],
            ['Kotak Mahindra', 'Kotak Mahindra Mutual Fund', 5, 'kotak.png'],
            ['Aditya Birla Sun Life', 'Aditya Birla Sun Life Mutual Fund', 6, 'absl.png'],
            ['Axis', 'Axis Mutual Fund', 7, 'axis.png'],
            ['UTI', 'UTI Mutual Fund', 8, 'uti.png'],
            ['Mirae Asset', 'Mirae Asset Mutual Fund', 9, 'mirae.png'],
            ['Tata', 'Tata Mutual Fund', 10, 'tata.png'],
            ['DSP', 'DSP Mutual Fund', 11, 'dsp.png'],
            ['Bandhan', 'Bandhan Mutual Fund', 12, 'bandhan.png']
        ];

        for (const [fundHouse, displayName, order, logo] of amcs) {
            await run(
                'INSERT INTO amc_master (fund_house, display_name, display_order, logo_url) VALUES (?, ?, ?, ?)',
                [fundHouse, displayName, order, `/amc-logos/${logo}`]
            );
            console.log(`Seeded: ${fundHouse}`);
        }

        console.log('AMC Seeding Done.');
        if (shouldExit) process.exit(0);
    } catch (error) {
        console.error('AMC Seeding Failed:', error);
        if (shouldExit) process.exit(1);
        throw error;
    }
}

// Run if called directly
import { fileURLToPath } from 'url';
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    seedAMCs(true);
}
