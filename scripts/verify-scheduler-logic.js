
import 'dotenv/config';
import { schedulerService } from '../src/services/scheduler.service.js';
import { transactionModel } from '../src/models/transaction.model.js';
import { holdingModel } from '../src/models/holding.model.js';
import { demoAccountModel } from '../src/models/demoAccount.model.js';
import { run, initializeDatabase } from '../src/db/database.js';

// Test Configuration
const TIMESTAMP = Date.now();
// const TEST_USER_EMAIL = `scheduler_test_${TIMESTAMP}@example.com`;
// Reuse same email if cleanup works, or random.
// Let's use random email but integer scheme code.
const TEST_USER_EMAIL = `scheduler_test_${TIMESTAMP}@example.com`;
const TEST_SCHEME_CODE = 999999;
const TEST_SCHEME_NAME = 'Test Mutual Fund';
const TEST_NAV = 100.0;
const SIP_AMOUNT = 5000;
const SWP_AMOUNT = 1000;

async function setup() {
    console.log('--- Setting up Test Data ---');

    await initializeDatabase();

    // 1b. Patch DB Schema for RECURRING status (Idempotent-ish)
    try {
        await run("ALTER TABLE transactions MODIFY COLUMN status ENUM('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED', 'RECURRING') NOT NULL DEFAULT 'SUCCESS'");
    } catch (e) {
        // Ignore if already altered or other minor issues, but log warning
        console.warn("Schema patch warning:", e.message);
    }

    // 1. Create User (Raw SQL to avoid model issues)
    const userRes = await run(
        `INSERT INTO users (full_name, email_id, username, password_hash, role, created_at) 
         VALUES (?, ?, ?, ?, 'user', ?)`,
        ['Scheduler Test', TEST_USER_EMAIL, TEST_USER_EMAIL, 'dummyhash', Date.now()]
    );
    const userId = userRes.lastInsertRowid;
    console.log(`Created Test User: ID ${userId}`);

    // 2. Create Demo Account
    await run(
        `INSERT INTO demo_accounts (user_id, balance, created_at, updated_at) 
         VALUES (?, ?, ?, ?)`,
        [userId, 100000.0, Date.now(), Date.now()]
    );

    // 3. Seed Fund & NAV
    await run(`INSERT INTO funds (scheme_code, scheme_name, fund_house, scheme_type, scheme_category, is_active) 
               VALUES (?, ?, 'Test Fund House', 'Open Ended', 'Equity Scheme - Large Cap', 1)`,
        [TEST_SCHEME_CODE, TEST_SCHEME_NAME]);

    await run(`INSERT INTO fund_nav_history (scheme_code, nav_date, nav_value) 
               VALUES (?, ?, ?)`,
        [TEST_SCHEME_CODE, new Date().toISOString().split('T')[0], TEST_NAV]);

    return userId;
}

async function verifySIP(userId) {
    console.log('\n--- Verifying SIP Logic ---');

    // Create Pending SIP Transaction
    // NOTE: nav must be > 0 due to DB constraint check
    const txn = await transactionModel.create({
        userId,
        schemeCode: TEST_SCHEME_CODE,
        schemeName: TEST_SCHEME_NAME,
        transactionType: 'SIP',
        amount: SIP_AMOUNT,
        units: 0,
        nav: 10,
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0], // Today
        installments: 12,
        status: 'PENDING',
        nextExecutionDate: new Date().toISOString().split('T')[0] // Due today
    });
    console.log(`Created SIP Transaction: ID ${txn.id}`);

    // Execute Scheduler
    console.log('Running Scheduler...');
    const result = await schedulerService.executeDueTransactions();
    console.log('Scheduler Result:', JSON.stringify(result, null, 2));

    // Assertions
    const holding = await holdingModel.findByScheme(userId, TEST_SCHEME_CODE);
    const updatedTxn = await transactionModel.findById(txn.id);

    let passed = true;

    // Check Status
    if (updatedTxn.status !== 'RECURRING') {
        console.error(`❌ SIP Status Assertion Failed: Expected 'RECURRING', got '${updatedTxn.status}'`);
        passed = false;
    } else {
        console.log(`✅ SIP Status Correct: ${updatedTxn.status}`);
    }

    // Check Holdings
    const expectedUnits = SIP_AMOUNT / TEST_NAV; // 5000 / 100 = 50
    if (!holding) {
        console.error(`❌ Holding Assertion Failed: Holding not created`);
        passed = false;
    } else if (Math.abs(holding.total_units - expectedUnits) > 0.01) {
        console.error(`❌ Holding Units Failed: Expected ${expectedUnits}, got ${holding.total_units}`);
        passed = false;
    } else if (Math.abs(holding.invested_amount - SIP_AMOUNT) > 0.01) {
        console.error(`❌ Holding Invested Amount Failed: Expected ${SIP_AMOUNT}, got ${holding.invested_amount}`);
        passed = false;
    } else {
        console.log(`✅ Holding Created Correctly: ${holding.total_units} units, ₹${holding.invested_amount} invested`);
    }

    return passed;
}

async function verifySWP(userId) {
    console.log('\n--- Verifying SWP Logic ---');

    // Create Pending SWP Transaction
    // Ensure we have holdings first (from SIP test)
    // Create SWP
    const txn = await transactionModel.create({
        userId,
        schemeCode: TEST_SCHEME_CODE,
        schemeName: TEST_SCHEME_NAME,
        transactionType: 'SWP',
        amount: SWP_AMOUNT, // Withdraw 1000
        units: 0,
        nav: 10,
        frequency: 'MONTHLY',
        startDate: new Date().toISOString().split('T')[0],
        installments: 12,
        status: 'PENDING',
        nextExecutionDate: new Date().toISOString().split('T')[0]
    });

    // Execute Scheduler
    console.log('Running Scheduler...');
    await schedulerService.executeDueTransactions();

    // Assertions
    const holding = await holdingModel.findByScheme(userId, TEST_SCHEME_CODE);
    const updatedTxn = await transactionModel.findById(txn.id);

    let passed = true;

    // Check Status (SWP should be PENDING as per plan)
    if (updatedTxn.status !== 'PENDING') {
        console.error(`❌ SWP Status Assertion Failed: Expected 'PENDING', got '${updatedTxn.status}'`);
        passed = false;
    } else {
        console.log(`✅ SWP Status Correct: ${updatedTxn.status}`);
    }

    // Check Holdings (Should be reduced)
    // Initial was 50 units (5000 invested). Withdrew 1000 INR @ 100 NAV = 10 units.
    // Remaining units = 40.
    // Remaining invested: Proportionate reduction.
    // Invested Amount Before = 5000. Units Before = 50. Cost/Unit = 100.
    // Redeemed Units = 10.
    // Amount to Remove = 10 * 100 = 1000.
    // Expected Invested = 4000.

    const expectedUnits = 40;
    const expectedInvested = 4000;

    if (Math.abs(holding.total_units - expectedUnits) > 0.01) {
        console.error(`❌ SWP Units Failed: Expected ${expectedUnits}, got ${holding.total_units}`);
        passed = false;
    } else {
        console.log(`✅ SWP Units Correct: ${holding.total_units}`);
    }

    if (Math.abs(holding.invested_amount - expectedInvested) > 1.0) {
        console.error(`❌ SWP Invested Amount Failed: Expected ${expectedInvested}, got ${holding.invested_amount}`);
        passed = false;
    } else {
        console.log(`✅ SWP Invested Amount Correct: ${holding.invested_amount}`);
    }

    return passed;
}

async function cleanup(userId) {
    console.log('\n--- Cleaning Up ---');
    try {
        await run('DELETE FROM users WHERE id = ?', [userId]);
        await run('DELETE FROM funds WHERE scheme_code = ?', [TEST_SCHEME_CODE]);
        await run('DELETE FROM fund_nav_history WHERE scheme_code = ?', [TEST_SCHEME_CODE]);
    } catch (e) {
        console.error('Cleanup warning:', e.message);
    }
    console.log('Cleanup Complete');
}

async function runTest() {
    let userId;
    try {
        userId = await setup();

        const sipPassed = await verifySIP(userId);
        if (!sipPassed) throw new Error('SIP Verification Failed');

        const swpPassed = await verifySWP(userId);
        if (!swpPassed) throw new Error('SWP Verification Failed');

        console.log('\n🎉 ALL TESTS PASSED!');
    } catch (err) {
        console.error('\n❌ TEST FAILED:', err);
    } finally {
        if (userId) await cleanup(userId);
        // Build exit
        process.exit(0);
    }
}

runTest();
