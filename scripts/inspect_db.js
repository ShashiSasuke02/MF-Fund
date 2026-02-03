import { transactionModel } from '../src/models/transaction.model.js';
import { holdingModel } from '../src/models/holding.model.js';
import { executionLogModel } from '../src/models/executionLog.model.js';
import { initializeDatabase, closeDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function inspect() {
    try {
        await initializeDatabase();

        const transactions = await transactionModel.findByUserId(1, 10);
        console.log('--- RECENT TRANSACTIONS (User 1) ---');
        transactions.forEach(t => {
            console.log(`ID: ${t.id}, Type: ${t.transaction_type}, Amount: ${t.amount}, Units: ${t.units}, NAV: ${t.nav}, Status: ${t.status}`);
        });

        const holdings = await holdingModel.findByUserId(1);
        console.log('\n--- HOLDINGS (User 1) ---');
        holdings.forEach(h => {
            console.log(`Scheme: ${h.scheme_name}, Units: ${h.total_units}, Last NAV: ${h.last_nav}, Date: ${h.last_nav_date}`);
        });

        const executionLogs = await executionLogModel.findByTransactionId(3);
        console.log('\n--- EXECUTION LOGS (Txn 3) ---');
        executionLogs.forEach(l => {
            console.log(`Date: ${l.execution_date}, Status: ${l.status}, Units: ${l.units}, NAV: ${l.nav}`);
        });

    } catch (err) {
        console.error(err);
    } finally {
        await closeDatabase();
    }
}

inspect();
