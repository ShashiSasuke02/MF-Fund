
import { transactionModel } from '../src/models/transaction.model.js';
import { schedulerService } from '../src/services/scheduler.service.js';
import { getISTDate } from '../src/utils/date.utils.js';

async function debugScheduler() {
    try {
        const istDate = getISTDate();
        console.log(`[Debug] Current IST Date: ${istDate}`);

        // 1. Check DB for due transactions
        console.log('[Debug] Querying transactionModel.findDueTransactions...');
        const due = await transactionModel.findDueTransactions(istDate);
        console.log(`[Debug] Found ${due.length} due transactions.`);

        if (due.length > 0) {
            console.table(due.map(t => ({
                id: t.id,
                scheme: t.scheme_name,
                nextDate: t.next_execution_date,
                status: t.status
            })));

            // 2. Dry Run or Execution
            console.log('[Debug] Running Scheduler Service...');
            const result = await schedulerService.executeDueTransactions(istDate);
            console.log('[Debug] Execution Result:', JSON.stringify(result, null, 2));
        } else {
            console.log('[Debug] No transactions due today. Checking raw DB for ANY future transactions...');
            // Check broad query
            const all = await transactionModel.findByUserId(1, 10); // Assume user ID 1
            console.log(`[Debug] Recent transactions for User 1:`);
            console.table(all.map(t => ({
                id: t.id,
                type: t.transaction_type,
                next: t.next_execution_date,
                status: t.status
            })));
        }

    } catch (error) {
        console.error('[Debug] Script Failed:', error);
    }
}

debugScheduler();
