import fundEnrichmentService from '../src/services/fundEnrichment.service.js';
import dotenv from 'dotenv';
dotenv.config();

async function debugIsin() {
    const isin = 'INF200K01SZ5';
    console.log(`Debug: Fetching data for ${isin}...`);
    try {
        const data = await fundEnrichmentService.fetchFundDetails(isin, 'debug-req');
        console.log('--- RAW ENRICHED DATA ---');
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

debugIsin();
