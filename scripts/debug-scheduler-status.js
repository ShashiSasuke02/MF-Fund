import { initializeDatabase, getDatabase } from '../src/db/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkSchedulerStatus() {
    try {
        console.log('--- Scheduler Status Debug ---');
        await initializeDatabase();
        const db = getDatabase();

        // 1. Check Transaction Columns (Double check)
        const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'transactions'
    `);
        const colNames = columns.map(c => c.COLUMN_NAME);
        console.log('Transaction Columns:', colNames.join(', '));

        // 2. Count Pending Transactions
        const [pending] = await db.query(`
      SELECT * FROM transactions WHERE status = 'PENDING'
    `);
        console.log(`\nFound ${pending.length} PENDING transactions.`);

        // 3. Check Due Transactions (Logic from Scheduler Service)
        const today = new Date().toISOString().split('T')[0];
        console.log(`Today is: ${today}`);

        // Replicate "Due" logic
        // next_execution_date <= target_date AND status = 'PENDING' AND is_locked = 0
        // AND (last_execution_date IS NULL OR last_execution_date != target_date)

        // Note: JS logic might differ slightly from SQL if not careful, but let's check SQL
        const [due] = await db.query(`
      SELECT * FROM transactions 
      WHERE status = 'PENDING' 
      AND (next_execution_date <= ? OR next_execution_date IS NULL)
    `, [today]);

        console.log(`\nPossibly Due Transactions (Raw Query): ${due.length}`);

        if (due.length > 0) {
            due.forEach(t => {
                console.log(`- ID: ${t.id}, Type: ${t.transaction_type}, Next: ${t.next_execution_date}, Last: ${t.last_execution_date}, Locked: ${t.is_locked}, LockedAt: ${t.locked_at}`);

                let reason = [];
                if (t.is_locked) reason.push('LOCKED');
                if (t.last_execution_date == today) reason.push('ALREADY_EXECUTED_TODAY');
                if (!t.next_execution_date) reason.push('NO_NEXT_DATE'); // Should default to something?

                if (reason.length > 0) {
                    console.log(`  -> WOULD SKIP: ${reason.join(', ')}`);
                } else {
                    console.log(`  -> SHOULD EXECUTE`);
                }
            });
        }

        // 4. Check Recent Execution Logs
        try {
            const [logs] = await db.query(`SELECT * FROM execution_logs ORDER BY id DESC LIMIT 5`);
            console.log(`\nRecent Execution Logs: ${logs.length}`);
            logs.forEach(l => {
                console.log(`- ID: ${l.id}, TxId: ${l.transaction_id}, Status: ${l.status}, Date: ${l.execution_date}, Msg: ${l.failure_reason || 'Success'}`);
            });
        } catch (e) {
            console.log('Could not fetch execution_logs (maybe table missing?)');
        }

        process.exit(0);
    } catch (error) {
        console.error('Debug script error:', error);
        process.exit(1);
    }
}

checkSchedulerStatus();
