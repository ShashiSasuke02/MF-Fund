
import { toISTDateString } from '../src/utils/date.utils.js';

console.log('--- IST Edge Case Verification ---');

const runTest = (inputUTC, expectedIST, description) => {
    const date = new Date(inputUTC);
    const output = toISTDateString(date);
    const pass = output === expectedIST;
    console.log(`Test: ${description}`);
    console.log(`   Input (UTC): ${inputUTC}`);
    console.log(`   Output (IST): ${output}`);
    console.log(`   Expected:     ${expectedIST}`);
    console.log(`   Result:       ${pass ? '✅ PASS' : '❌ FAIL'}`);
    console.log('-------------------------------------');
};

// Case 1: Jan 31st Boundary
// UTC: Jan 30th 20:00 -> IST: Jan 31st 01:30 (+5:30)
runTest('2026-01-30T20:00:00Z', '2026-01-31', 'Late Jan 30 UTC -> Jan 31 IST (Month End Boundary)');

// Case 2: Jan 31st Late
// UTC: Jan 31st 20:00 -> IST: Feb 1st 01:30 (+5:30)
runTest('2026-01-31T20:00:00Z', '2026-02-01', 'Late Jan 31 UTC -> Feb 01 IST (Month rollover)');

// Case 3: Feb 28th (Non-Leap Year 2026)
// UTC: Feb 28th 20:00 -> IST: Mar 1st 01:30
runTest('2026-02-28T20:00:00Z', '2026-03-01', 'Late Feb 28 UTC -> Mar 01 IST (Feb rollover)');

// Case 4: Standard Mid-day
// UTC: Feb 28th 10:00 -> IST: Feb 28th 15:30
runTest('2026-02-28T10:00:00Z', '2026-02-28', 'Mid-day Feb 28 UTC -> Feb 28 IST (Same Day)');

console.log('--- Verification Complete ---');
