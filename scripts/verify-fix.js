
import { schedulerService } from '../src/services/scheduler.service.js';
import { holdingModel } from '../src/models/holding.model.js';
import { demoAccountModel } from '../src/models/demoAccount.model.js';
import { transactionModel } from '../src/models/transaction.model.js';
import { localFundService } from '../src/services/localFund.service.js';

// Mock dependencies to avoid actual DB writes or external calls during simple logic verification
// However, since we want to verifying the "Incorrect decimal value" fix which is DB related, 
// we should ideally try to reproduce the string concatenation flow.

// We will create a test that mocks the "bad data" scenario to ensure our service fixes it.

async function verifyFix() {
    console.log('Verifying Scheduler Service Float Fixes...');

    // 1. Mock Data that caused issues (Strings)
    const badTransaction = {
        id: 999,
        user_id: 1,
        scheme_code: '12345',
        scheme_name: 'Test Fund',
        amount: '5000.00', // String from DB
        transaction_type: 'SIP'
    };

    const mockNavData = { nav: '100.00' }; // String from DB
    const mockAccount = { balance: '100000.00' }; // String from DB

    // We need to overwrite the methods we call to intercept the values
    // and check if they are Numbers when passed to the models.

    const originalFindUserId = demoAccountModel.findByUserId;
    const originalUpdateBalance = demoAccountModel.updateBalance;
    const originalFindByScheme = holdingModel.findByScheme;
    const originalAddUnits = holdingModel.addUnits;
    const originalUpsert = holdingModel.upsert;
    const originalUpdateCurrentValue = holdingModel.updateCurrentValue;
    const originalGetLatestNAV = localFundService.getLatestNAV;

    let checksPassed = 0;
    const totalChecks = 3; // Units, Amount, Balance updates

    try {
        // Mock Service Calls
        localFundService.getLatestNAV = async () => mockNavData;
        demoAccountModel.findByUserId = async () => mockAccount;

        // Mock Model Calls with Type Checks
        demoAccountModel.updateBalance = async (userId, newBalance) => {
            console.log(`[Check 1] updateBalance called with type: ${typeof newBalance}, value: ${newBalance}`);
            if (typeof newBalance === 'number' && !isNaN(newBalance)) {
                checksPassed++;
            } else {
                console.error('❌ updateBalance received non-number');
            }
        };

        holdingModel.findByScheme = async () => ({ id: 1 }); // Simulate existing holding

        holdingModel.addUnits = async (userId, schemeCode, units, amount) => {
            console.log(`[Check 2] addUnits called with units type: ${typeof units}, value: ${units}`);
            console.log(`[Check 3] addUnits called with amount type: ${typeof amount}, value: ${amount}`);

            if (typeof units === 'number' && !isNaN(units)) checksPassed++;
            else console.error('❌ addUnits received non-number units');

            if (typeof amount === 'number' && !isNaN(amount)) checksPassed++;
            else console.error('❌ addUnits received non-number amount');
        };

        holdingModel.updateCurrentValue = async () => { };

        // Run the function
        await schedulerService.executeSIP(badTransaction);

        if (checksPassed === totalChecks) {
            console.log('✅ ALL CHECKS PASSED: Inputs are correctly converted to numbers.');
        } else {
            console.error(`❌ FAILED: Only ${checksPassed}/${totalChecks} checks passed.`);
        }

    } catch (error) {
        console.error('Test Execution Failed:', error);
    } finally {
        // Restore
        localFundService.getLatestNAV = originalGetLatestNAV;
        demoAccountModel.findByUserId = originalFindUserId;
        demoAccountModel.updateBalance = originalUpdateBalance;
        holdingModel.findByScheme = originalFindByScheme;
        holdingModel.addUnits = originalAddUnits;
        holdingModel.upsert = originalUpsert;
        holdingModel.updateCurrentValue = originalUpdateCurrentValue;
    }
}

verifyFix();
