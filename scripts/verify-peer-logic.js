
import { fundModel } from '../src/models/fund.model.js';
import db from '../src/db/database.js';

// Mock DB
db.queryOne = async (query, params) => {
    console.log('\n--- SQL Query ---');
    console.log(query.trim());
    console.log('--- Params ---');
    console.log(params);

    if (query.includes('LIKE ?') && params[0].endsWith(' - %') &&
        query.includes("'%Direct Plan%'") && query.includes("'%Growth%'")) {
        return {
            scheme_name: 'ICICI Prudential Bharat Consumption Fund - Direct Plan - Growth',
            aum: 1000
        };
    }
    return null;
};

async function test() {
    console.log('Testing findPeerFundWithData...');
    const result = await fundModel.findPeerFundWithData('ICICI Prudential Bharat Consumption Fund', 123);

    if (result && result.scheme_name.includes('Direct Plan')) {
        console.log('\n✅ SUCCESS: Found correct peer using strict logic.');
    } else {
        console.error('\n❌ FAILED: Did not find peer or logic incorrect.');
        process.exit(1);
    }
}

test();
