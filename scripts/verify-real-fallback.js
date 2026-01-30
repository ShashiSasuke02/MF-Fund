import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://127.0.0.1:4000/api';
const TARGET_SCHEME = 112096; // ICICI Prudential All Seasons Bond Fund - Growth (Missing Data)
const EXPECTED_AUM = 149441.00; // From Peer 120603

async function verifyRealFallback() {
    console.log(`🚀 Verifying Fallback for Scheme ${TARGET_SCHEME}...`);
    try {
        const response = await axios.get(`${BASE_URL}/funds/${TARGET_SCHEME}`);
        const data = response.data.data.meta;

        console.log('--- API Response ---');
        console.log(`Name: ${data.scheme_name}`);
        console.log(`AUM: ${data.aum}`);
        console.log(`Source: ${data.data_source_type}`);
        console.log(`Synced At: ${data.detail_info_synced_at}`);

        // Note: AUM might be string or number depending on API
        if (parseFloat(data.aum) === EXPECTED_AUM) {
            console.log('🎉 SUCCESS: Real-world fallback worked!');
            console.log('Fund successfully borrowed AUM from peer.');
        } else {
            console.log('❌ FAILURE: AUM mismatch or fallback failed.');
            console.log(`Expected: ${EXPECTED_AUM}, Got: ${data.aum}`);
        }

    } catch (e) {
        console.error('❌ Error:', e.message);
        if (e.response) {
            console.error('API Status:', e.response.status);
        }
    }
}

verifyRealFallback();
