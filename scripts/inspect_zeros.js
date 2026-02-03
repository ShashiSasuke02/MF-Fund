import { transactionModel } from '../src/models/transaction.model.js';
import { holdingModel } from '../src/models/holding.model.js';
import { executionLogModel } from '../src/models/executionLog.model.js';
import { query } from '../src/db/database.js';
import { initializeDatabase, closeDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function inspect() {
    try {
        await initializeDatabase();

        console.log('--- Transactions with 0 units or 0 NAV ---');
        const zeroTxns = await query('SELECT * FROM transactions WHERE units = 0 OR nav = 0');
        console.log(`Found ${zeroTxns.length} transactions with 0 units or NAV`);
        zeroTxns.forEach(t => {
            console.log(`ID: ${t.id}, Type: ${t.transaction_type}, Amount: ${t.amount}, Units: ${t.units}, NAV: ${t.nav}, Status: ${t.status}`);
        });

        console.log('\n--- Holdings with 0 units ---');
        const zeroHoldings = await query('SELECT * FROM holdings WHERE total_units = 0');
        console.log(`Found ${zeroHoldings.length} holdings with 0 units`);
        zeroHoldings.forEach(h => {
            console.log(`User: ${h.user_id}, Scheme: ${h.scheme_name}, Units: ${h.total_units}`);
        });

        console.log('\n--- User Holdings with 0 NAV in latest history ---');
        const userZeroNavs = await query(`
        SELECT h.user_id, h.scheme_code, h.scheme_name, nav.nav_value, nav.nav_date
        FROM holdings h
        JOIN (
            SELECT scheme_code, nav_value, nav_date
            FROM fund_nav_history n1
            WHERE nav_date = (SELECT MAX(nav_date) FROM fund_nav_history n2 WHERE n2.scheme_code = n1.scheme_code)
        ) nav ON h.scheme_code = nav.scheme_code
        WHERE nav.nav_value = 0
    `);
        console.log(`Found ${userZeroNavs.length} user holdings with latest NAV = 0`);
        userZeroNavs.forEach(h => {
            console.log(`User: ${h.user_id}, Scheme: ${h.scheme_code}, Name: ${h.scheme_name}, NAV: ${h.nav_value}, Date: ${h.nav_date}`);
        });

        console.log('\n--- Funds with 0 NAV in history (Example 10) ---');
        const zeroNavs = await query('SELECT h.*, f.scheme_name FROM fund_nav_history h JOIN funds f ON h.scheme_code = f.scheme_code WHERE h.nav_value = 0 LIMIT 10');
        console.log(`Found ${zeroNavs.length} NAV records with 0 value`);
        zeroNavs.forEach(n => {
            console.log(`Scheme: ${n.scheme_code}, Name: ${n.scheme_name}, Date: ${n.nav_date}, NAV: ${n.nav_value}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await closeDatabase();
    }
}

inspect();
