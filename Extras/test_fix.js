
// Mocking the utility from src/utils/date.utils.js for isolation testing or importing it directly
// We will test the logic that is now implemented in the services.

// MOCK: src/utils/date.utils.js content logic
const toISTDateString = (date) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-CA', {
        timeZone: 'Asia/Kolkata'
    });
};

// MOCK: The fixed logic in scheduler/demo service
const calculateNextDateData = (currentDate, frequency) => {
    const current = new Date(currentDate);
    let next;

    switch (frequency) {
        case 'DAILY':
            next = new Date(current);
            next.setDate(current.getDate() + 1); // Add 1 day
            break;
        case 'MONTHLY':
            next = new Date(current);
            next.setMonth(current.getMonth() + 1);
            break;
    }

    // THE FIX: Using toISTDateString instead of toISOString
    const isoResult = next.toISOString().split('T')[0];
    const istResult = toISTDateString(next);

    return {
        input: currentDate,
        nextObjUTC: next.toISOString(),
        isoMethod: isoResult,
        istMethod: istResult
    };
};

console.log("--- Testing Fix Logic ---");

// Case 1: Midnight Boundary
// If "Today" is Jan 31st 00:00:00 IST
// UTC: Jan 30th 18:30:00 UTC
const todayISTBound = new Date("2026-01-31T00:00:00+05:30");
console.log(`\nInput: ${todayISTBound.toString()}`);

const resDaily = calculateNextDateData(todayISTBound, 'DAILY');
console.log(`\nFrequency: DAILY`);
console.log(`Expected Next: 2026-02-01`);
console.log(`ISO Method (Buggy): ${resDaily.isoMethod}`);
console.log(`IST Method (Fixed): ${resDaily.istMethod}`);

const resMonthly = calculateNextDateData(todayISTBound, 'MONTHLY');
console.log(`\nFrequency: MONTHLY`);
console.log(`Expected Next: 2026-02-28 (or 03-02/03 depending on JS logic)`); // JS Date rollover behavior
console.log(`ISO Method (Buggy): ${resMonthly.isoMethod}`);
console.log(`IST Method (Fixed): ${resMonthly.istMethod}`);

if (resDaily.istMethod === '2026-02-01') {
    console.log("\nSUCCESS: Daily SIP date calculated correctly in IST.");
} else {
    console.log("\nFAILURE: Daily calculation incorrect.");
}
